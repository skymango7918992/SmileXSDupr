export type DuprConfigMode = "token" | "credentials" | "none";

export type DuprEnvStatus = {
  mode: DuprConfigMode;
  hasToken: boolean;
  hasEmail: boolean;
  hasPassword: boolean;
  /** @deprecated 使用 xsClubId */
  clubId: string;
  xsClubId: string;
  khpaClubId: string;
};
