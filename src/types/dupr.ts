export type DuprConfigMode = "token" | "credentials" | "none";

export type DuprEnvStatus = {
  mode: DuprConfigMode;
  hasToken: boolean;
  hasEmail: boolean;
  hasPassword: boolean;
  clubId: string;
};
