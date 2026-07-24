import { Inject, Injectable } from "@nestjs/common";
import {
  ACTOR_ROLE,
  DomainError,
  assertCanPrintQr,
  calculateQrExpiry,
  type ActorRole,
  type QrPrintLineRequest,
} from "@volt-rewards/domain";
import { createQrTokenValue, hashQrToken } from "./qr-token.js";
import {
  QR_PRINT_REPOSITORY,
  type QrPrintRepository,
  type QrPrintResult,
  type QrPrintTokenAssignment,
  type PrintedQrUnit,
} from "./qr-print.repository.js";

export interface PrintQrCommand {
  readonly invoiceId: string;
  readonly actorRole: ActorRole;
  readonly actorUserId?: string;
  readonly lines: readonly QrPrintLineRequest[];
  readonly printedAt: Date;
}

export interface ReprintQrCommand {
  readonly qrUnitId: string;
  readonly actorRole: ActorRole;
  readonly actorUserId?: string;
  readonly reprintedAt: Date;
}

@Injectable()
export class QrPrintService {
  constructor(
    @Inject(QR_PRINT_REPOSITORY)
    private readonly repository: QrPrintRepository,
  ) {}

  async printQr(command: PrintQrCommand): Promise<QrPrintResult> {
    const lineIds = command.lines.map((line) => line.invoiceLineId);
    const availabilities = await this.repository.getLineAvailabilities(command.invoiceId, lineIds);
    assertCanPrintQr(command.actorRole, command.lines, availabilities);

    const expiresAt = calculateQrExpiry(command.printedAt);
    const tokenAssignments = createTokenAssignments(command.lines);

    return this.repository.commitQrPrint({
      invoiceId: command.invoiceId,
      actorRole: command.actorRole,
      ...(command.actorUserId ? { actorUserId: command.actorUserId } : {}),
      printedAt: command.printedAt,
      expiresAt,
      selections: command.lines,
      tokenAssignments,
    });
  }

  async reprintQr(command: ReprintQrCommand): Promise<PrintedQrUnit> {
    if (command.actorRole !== ACTOR_ROLE.OWNER && command.actorRole !== ACTOR_ROLE.ADMIN && command.actorRole !== ACTOR_ROLE.STAFF) {
      throw new DomainError("QR_REPRINT_FORBIDDEN_ACTOR", "Only OWNER, ADMIN, or STAFF can perform this QR operation.");
    }

    const tokenValue = createQrTokenValue();
    return this.repository.reprintQr({
      qrUnitId: command.qrUnitId,
      actorRole: command.actorRole,
      ...(command.actorUserId ? { actorUserId: command.actorUserId } : {}),
      reprintedAt: command.reprintedAt,
      tokenValue,
      tokenHash: hashQrToken(tokenValue),
    });
  }
}

function createTokenAssignments(lines: readonly QrPrintLineRequest[]): readonly QrPrintTokenAssignment[] {
  return lines.flatMap((line) =>
    Array.from({ length: line.quantity }, () => {
      const tokenValue = createQrTokenValue();
      return {
        invoiceLineId: line.invoiceLineId,
        tokenValue,
        tokenHash: hashQrToken(tokenValue),
      };
    }),
  );
}
