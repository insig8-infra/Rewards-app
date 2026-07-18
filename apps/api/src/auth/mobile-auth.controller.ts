import { Body, Controller, Post } from "@nestjs/common";
import { MobileAuthService } from "./mobile-auth.service.js";

@Controller("auth")
export class MobileAuthController {
  constructor(private readonly auth: MobileAuthService) {}

  @Post("admin/login")
  loginAdmin(
    @Body()
    body: {
      readonly role: "OWNER" | "STAFF";
      readonly mobileNumber: string;
      readonly pin: string;
      readonly surface?: "ADMIN_MOBILE" | "ADMIN_WEB";
      readonly now?: string;
    },
  ): ReturnType<MobileAuthService["loginAdmin"]> {
    return this.auth.loginAdmin(body, body.now ? new Date(body.now) : new Date());
  }

  @Post("contractor/login")
  loginContractor(
    @Body()
    body: {
      readonly mobileNumber: string;
      readonly mpin: string;
      readonly now?: string;
    },
  ): ReturnType<MobileAuthService["loginContractor"]> {
    return this.auth.loginContractor(body, body.now ? new Date(body.now) : new Date());
  }

  @Post("contractor/set-mpin")
  setContractorMpin(
    @Body()
    body: {
      readonly setupSessionToken: string;
      readonly newMpin: string;
      readonly confirmMpin: string;
      readonly now?: string;
    },
  ): ReturnType<MobileAuthService["setContractorMpin"]> {
    return this.auth.setContractorMpin(body, body.now ? new Date(body.now) : new Date());
  }

  @Post("contractor/change-mpin")
  changeContractorMpin(
    @Body()
    body: {
      readonly sessionToken: string;
      readonly oldMpin: string;
      readonly newMpin: string;
      readonly confirmMpin: string;
      readonly now?: string;
    },
  ): ReturnType<MobileAuthService["changeContractorMpin"]> {
    return this.auth.changeContractorMpin(body, body.now ? new Date(body.now) : new Date());
  }

  @Post("contractor/profile-photo")
  updateContractorPhoto(
    @Body()
    body: {
      readonly sessionToken: string;
      readonly photoUrl?: string | null;
      readonly now?: string;
    },
  ): ReturnType<MobileAuthService["updateContractorPhoto"]> {
    return this.auth.updateContractorPhoto(body, body.now ? new Date(body.now) : new Date());
  }

  @Post("contractor/forgot-mpin")
  forgotContractorMpin(
    @Body()
    body: {
      readonly mobileNumber: string;
    },
  ): ReturnType<MobileAuthService["forgotContractorMpin"]> {
    return this.auth.forgotContractorMpin(body);
  }

  @Post("team-member/request-otp")
  requestTeamMemberOtp(
    @Body()
    body: {
      readonly contractorMobileNumber: string;
      readonly teamMemberMobile?: string;
      readonly deviceContext?: Record<string, unknown>;
      readonly now?: string;
    },
  ): ReturnType<MobileAuthService["requestTeamMemberOtp"]> {
    return this.auth.requestTeamMemberOtp(
      {
        contractorMobileNumber: body.contractorMobileNumber,
        ...(body.teamMemberMobile ? { teamMemberMobile: body.teamMemberMobile } : {}),
        ...(isDeviceContext(body.deviceContext) ? { deviceContext: body.deviceContext } : {}),
      },
      body.now ? new Date(body.now) : new Date(),
    );
  }

  @Post("team-member/verify-otp")
  verifyTeamMemberOtp(
    @Body()
    body: {
      readonly challengeId: string;
      readonly otp: string;
      readonly teamMemberMobile?: string;
      readonly now?: string;
    },
  ): ReturnType<MobileAuthService["verifyTeamMemberOtp"]> {
    return this.auth.verifyTeamMemberOtp(body, body.now ? new Date(body.now) : new Date());
  }
}

function isDeviceContext(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
