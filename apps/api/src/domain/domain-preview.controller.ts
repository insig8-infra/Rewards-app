import { Body, Controller, Post } from "@nestjs/common";
import type {
  ActorRole,
  ContractorPoints,
  QrUnit,
  RewardCatalogItem,
  RewardClaim,
} from "@volt-rewards/domain";
import { DomainPreviewService } from "./domain-preview.service.js";

@Controller("domain-preview")
export class DomainPreviewController {
  constructor(private readonly domain: DomainPreviewService) {}

  @Post("qr/scan")
  scanQr(
    @Body()
    body: {
      readonly qr: QrUnit;
      readonly input: Parameters<DomainPreviewService["scanQr"]>[1];
    },
  ): ReturnType<DomainPreviewService["scanQr"]> {
    return this.domain.scanQr(coerceQr(body.qr), {
      ...body.input,
      now: new Date(body.input.now),
    });
  }

  @Post("qr/reprint")
  reprintQr(
    @Body()
    body: {
      readonly qr: QrUnit;
      readonly input: { readonly actorRole: ActorRole; readonly replacementToken: string; readonly now: string };
    },
  ): ReturnType<DomainPreviewService["reprintQr"]> {
    return this.domain.reprintQr(coerceQr(body.qr), {
      ...body.input,
      now: new Date(body.input.now),
    });
  }

  @Post("qr/cancel")
  cancelQr(
    @Body()
    body: {
      readonly qr: QrUnit;
      readonly input: { readonly actorRole: ActorRole; readonly labelRemovedAndDiscarded: boolean; readonly now: string };
    },
  ): ReturnType<DomainPreviewService["cancelQr"]> {
    return this.domain.cancelQr(coerceQr(body.qr), {
      ...body.input,
      now: new Date(body.input.now),
    });
  }

  @Post("qr/reverse")
  reverseQr(
    @Body()
    body: {
      readonly qr: QrUnit;
      readonly input: Parameters<DomainPreviewService["reverseQr"]>[1];
    },
  ): ReturnType<DomainPreviewService["reverseQr"]> {
    return this.domain.reverseQr(coerceQr(body.qr), body.input);
  }

  @Post("rewards/redeem")
  redeemReward(
    @Body()
    body: {
      readonly contractor: ContractorPoints;
      readonly reward: RewardCatalogItem;
      readonly input: Parameters<DomainPreviewService["redeemReward"]>[2];
    },
  ): ReturnType<DomainPreviewService["redeemReward"]> {
    return this.domain.redeemReward(body.contractor, body.reward, body.input);
  }

  @Post("rewards/cancel")
  cancelReward(
    @Body()
    body: {
      readonly contractor: ContractorPoints;
      readonly claim: RewardClaim;
    },
  ): ReturnType<DomainPreviewService["cancelChosenReward"]> {
    return this.domain.cancelChosenReward(body.contractor, body.claim);
  }

  @Post("rewards/fulfill")
  fulfillReward(
    @Body()
    body: {
      readonly claim: RewardClaim;
      readonly input: { readonly actorRole: ActorRole; readonly otpVerified: boolean };
    },
  ): ReturnType<DomainPreviewService["fulfillReward"]> {
    return this.domain.fulfillReward(body.claim, body.input);
  }
}

function coerceQr(qr: QrUnit): QrUnit {
  return {
    ...qr,
    expiresAt: new Date(qr.expiresAt),
  };
}

