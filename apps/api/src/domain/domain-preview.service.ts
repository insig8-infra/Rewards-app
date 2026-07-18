import { Injectable } from "@nestjs/common";
import {
  cancelChosenReward,
  cancelQr,
  fulfillReward,
  redeemReward,
  reprintQr,
  reverseQr,
  scanQr,
  type ContractorPoints,
  type QrUnit,
  type RewardCatalogItem,
  type RewardClaim,
  type ActorRole,
} from "@volt-rewards/domain";

@Injectable()
export class DomainPreviewService {
  scanQr(
    qr: QrUnit,
    input: Parameters<typeof scanQr>[1],
  ): ReturnType<typeof scanQr> {
    return scanQr(qr, input);
  }

  cancelQr(
    qr: QrUnit,
    input: Parameters<typeof cancelQr>[1],
  ): ReturnType<typeof cancelQr> {
    return cancelQr(qr, input);
  }

  reverseQr(
    qr: QrUnit,
    input: Parameters<typeof reverseQr>[1],
  ): ReturnType<typeof reverseQr> {
    return reverseQr(qr, input);
  }

  reprintQr(
    qr: QrUnit,
    input: Parameters<typeof reprintQr>[1],
  ): ReturnType<typeof reprintQr> {
    return reprintQr(qr, input);
  }

  redeemReward(
    contractor: ContractorPoints,
    reward: RewardCatalogItem,
    input: Parameters<typeof redeemReward>[2],
  ): ReturnType<typeof redeemReward> {
    return redeemReward(contractor, reward, input);
  }

  cancelChosenReward(
    contractor: ContractorPoints,
    claim: RewardClaim,
  ): ReturnType<typeof cancelChosenReward> {
    return cancelChosenReward(contractor, claim);
  }

  fulfillReward(
    claim: RewardClaim,
    input: { readonly actorRole: ActorRole; readonly otpVerified: boolean },
  ): ReturnType<typeof fulfillReward> {
    return fulfillReward(claim, input);
  }
}

