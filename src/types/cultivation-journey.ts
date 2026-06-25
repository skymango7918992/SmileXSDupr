/** 管理員 DUPR ID，用於自動匯入同門切磋 */
export const ADMIN_MANAGER_DUPR_ID = "MPNX6P";

export type CultivationRecordType = "retreat" | "sparring" | "trial";

export type CultivationRecordSource = "manual" | "xs_dupr" | "khpa_dupr";

export type CultivationMatchResult = "win" | "loss" | "draw";

export type XpBreakdownItem = {
  label: string;
  points: number;
};

export type CultivationRecord = {
  id: string;
  user_id: string;
  record_type: CultivationRecordType;
  occurred_on: string;
  venue_name: string;
  duration_minutes: number | null;
  practice_skills: string[];
  self_rating: number | null;
  notes: string;
  team1_score: number | null;
  team2_score: number | null;
  my_team: 1 | 2 | null;
  result: CultivationMatchResult | null;
  trial_wins: number | null;
  trial_losses: number | null;
  source: CultivationRecordSource;
  source_match_id: string | null;
  source_platform: string | null;
  xp_earned: number;
  xp_breakdown: XpBreakdownItem[];
  created_at: string;
  updated_at: string;
};

export type CultivationProfile = {
  user_id: string;
  skill_xp: Record<string, number>;
  active_demons: string[];
  conquered_demons: string[];
  created_at: string;
  updated_at: string;
};

export type CultivationJourneyBundle = {
  profile: CultivationProfile;
  records: CultivationRecord[];
  totalXp: number;
};

export type CultivationSkillId =
  | "serve"
  | "return"
  | "third_shot"
  | "dink"
  | "volley"
  | "lob"
  | "defense"
  | "positioning";

export type CultivationDemonId =
  | "itchy_hands"
  | "float_demon"
  | "backhand_demon"
  | "run_around"
  | "glass_heart";

/** @deprecated 改用 pickleball-techniques PICKLEBALL_TECHNIQUES */
export const CULTIVATION_SKILLS: {
  id: CultivationSkillId;
  label: string;
  hint: string;
}[] = [
  { id: "serve", label: "發球", hint: "穩定開局，不送分" },
  { id: "return", label: "接發", hint: "深球回深，淺球回淺" },
  { id: "third_shot", label: "第三拍", hint: "吊球、抽球、推進" },
  { id: "dink", label: "Dink", hint: "廚房輕柔對峙" },
  { id: "volley", label: "Volley", hint: "網前截擊不手軟" },
  { id: "lob", label: "Lob", hint: "高吊過頂，爭取時間" },
  { id: "defense", label: "退防", hint: "被壓制時穩住陣腳" },
  { id: "positioning", label: "雙打補位", hint: "跟隊友不搶位" },
];

export const CULTIVATION_DEMONS: {
  id: CultivationDemonId;
  label: string;
  description: string;
  counter: string;
}[] = [
  {
    id: "itchy_hands",
    label: "手癢心魔",
    description: "明明該 Dink，卻忍不住殺球。",
    counter: "深呼吸三秒，先穩住第三拍。",
  },
  {
    id: "float_demon",
    label: "飛球心魔",
    description: "高球來了就慌，腳步全亂。",
    counter: "退後半步，用身體對準落點。",
  },
  {
    id: "backhand_demon",
    label: "反手心魔",
    description: "反手區域像禁區，能閃就閃。",
    counter: "每日 50 球反手練習，閉關破魔。",
  },
  {
    id: "run_around",
    label: "亂跑心魔",
    description: "隊友還在場上，你已經衝去隔壁場。",
    counter: "記住：補位比殺球更接近勝利。",
  },
  {
    id: "glass_heart",
    label: "玻璃心魔",
    description: "一失誤就覺得今天完了。",
    counter: "落敗也是修為，寫下心得再出關。",
  },
];

export const RECORD_TYPE_LABEL: Record<CultivationRecordType, string> = {
  retreat: "閉關練球",
  sparring: "同門切磋",
  trial: "天榜試煉",
};

export const RECORD_TYPE_ICON: Record<CultivationRecordType, string> = {
  retreat: "🧘",
  sparring: "⚔️",
  trial: "⚡",
};
