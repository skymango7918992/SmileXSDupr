import type { ProficiencyLevelKey } from "@/lib/pickleball-techniques";

export type TechniqueProgress = {
  user_id: string;
  technique_id: string;
  proficiency_score: number;
  proficiency_level: ProficiencyLevelKey;
  total_practice_count: number;
  total_practice_minutes: number;
  last_practiced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PracticeSession = {
  id: string;
  user_id: string;
  practice_date: string;
  location_id: string | null;
  location_name: string;
  duration_minutes: number;
  technique_ids: string[];
  self_rating: number | null;
  has_improvement: boolean;
  note: string;
  mood: string | null;
  cultivation_record_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PracticeTechniqueLog = {
  id: string;
  practice_session_id: string;
  user_id: string;
  technique_id: string;
  gained_exp: number;
  before_score: number;
  after_score: number;
  before_level: ProficiencyLevelKey;
  after_level: ProficiencyLevelKey;
  is_level_up: boolean;
  note: string | null;
  created_at: string;
};

export type PracticeLocationOption = {
  id: string;
  name: string;
};

export type TechniqueLevelUp = {
  techniqueId: string;
  techniqueName: string;
  beforeLevel: string;
  afterLevel: string;
  afterScore: number;
};

export type CreatePracticeSessionResult = {
  practiceSession: PracticeSession;
  techniqueLogs: PracticeTechniqueLog[];
  levelUps: TechniqueLevelUp[];
  gainedPerTechnique: { techniqueId: string; techniqueName: string; gainedExp: number }[];
  realmXpEarned: number;
};

export type TechniqueLogWithSession = PracticeTechniqueLog & {
  practice_date: string;
  location_name: string;
  duration_minutes: number;
  session_note: string;
};
