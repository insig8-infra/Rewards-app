import { Inject, Injectable } from "@nestjs/common";
import {
  QR_PRINT_HISTORY_REPOSITORY,
  type QrPrintHistoryEntry,
  type QrPrintHistoryRepository,
} from "./qr-print-history.repository.js";

@Injectable()
export class QrPrintHistoryService {
  constructor(
    @Inject(QR_PRINT_HISTORY_REPOSITORY)
    private readonly repository: QrPrintHistoryRepository,
  ) {}

  listPrintHistory(): Promise<readonly QrPrintHistoryEntry[]> {
    return this.repository.listPrintHistory();
  }
}
