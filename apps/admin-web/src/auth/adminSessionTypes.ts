export type AdminRole = "OWNER" | "ADMIN" | "STAFF";

export interface AdminSessionView {
  readonly role: AdminRole;
  readonly actorName?: string;
  readonly actorLabel: string;
  readonly roleLabel: string;
  readonly allowedSections: readonly string[];
}

export interface AdminLoginResponse {
  readonly status: "AUTHENTICATED";
  readonly admin: {
    readonly userId: string;
    readonly role: AdminRole;
    readonly name: string;
    readonly mobileNumber: string;
    readonly photoUrl?: string;
    readonly staffId?: string;
  };
  readonly session: {
    readonly token: string;
    readonly expiresAt: string;
    readonly actor: {
      readonly role: AdminRole;
      readonly userId: string;
    };
  };
}
