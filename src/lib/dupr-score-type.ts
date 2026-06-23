import type { ScoreType } from "@/types/database";

export const SCORE_TYPE_CSV: Record<ScoreType, "SIDEOUT" | "RALLY"> = {
  sideout: "SIDEOUT",
  rally: "RALLY",
};

export const SCORE_TYPE_LABEL: Record<ScoreType, string> = {
  sideout: "發球得分",
  rally: "落地得分",
};

export const SCORE_TYPE_HINT: Record<ScoreType, string> = {
  sideout: "傳統制：只有發球方得分（DUPR SIDEOUT）",
  rally: "每球皆計分（DUPR RALLY）",
};

export function toDuprScoreType(scoreType: ScoreType): "SIDEOUT" | "RALLY" {
  return SCORE_TYPE_CSV[scoreType];
}
