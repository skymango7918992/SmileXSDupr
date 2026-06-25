export type ProficiencyLevelKey =
  | "minor_success"
  | "subtle"
  | "major_success"
  | "perfection";

export type TechniqueLevelTitles = Record<ProficiencyLevelKey, string>;

export type PickleballTechnique = {
  id: string;
  name: string;
  shot: string;
  category: string;
  focus: string;
  quote: string;
  levelTitles: TechniqueLevelTitles;
};

export const PROFICIENCY_LEVELS = [
  {
    key: "minor_success" as const,
    name: "小成",
    min: 0,
    max: 24,
    description: "初窺此道，球還不太聽話。",
  },
  {
    key: "subtle" as const,
    name: "入微",
    min: 25,
    max: 59,
    description: "拍感漸明，已能窺見落點玄機。",
  },
  {
    key: "major_success" as const,
    name: "大成",
    min: 60,
    max: 84,
    description: "此功已成，勝負之間皆可施展。",
  },
  {
    key: "perfection" as const,
    name: "圓滿",
    min: 85,
    max: 100,
    description: "一拍出手，已近返璞歸真。",
  },
] as const;

export const PICKLEBALL_TECHNIQUES: PickleballTechnique[] = [
  {
    id: "serve",
    name: "開山發球訣",
    shot: "發球 Serve",
    category: "開局",
    focus: "進球率、深度、落點、旋轉、穩定開局",
    quote: "一拍開山，球未落地，氣勢已先壓三分。",
    levelTitles: {
      minor_success: "發球入門",
      subtle: "落點初定",
      major_success: "一拍開山",
      perfection: "開局鎮場",
    },
  },
  {
    id: "return",
    name: "定海接發功",
    shot: "接發 Return of Serve",
    category: "開局",
    focus: "接發深度、穩定回球、讓自己有時間上前",
    quote: "接發如定海，一球壓住對手前進之路。",
    levelTitles: {
      minor_success: "接發不慌",
      subtle: "深球定海",
      major_success: "回元壓境",
      perfection: "一接封路",
    },
  },
  {
    id: "forehand_drive",
    name: "正手破風擊",
    shot: "正手抽球 Forehand Drive",
    category: "底線",
    focus: "正手拍面控制、力量、深度、穿越速度",
    quote: "正手一起，風聲先至；敵未反應，球已破陣。",
    levelTitles: {
      minor_success: "正手初鳴",
      subtle: "破風成線",
      major_success: "一拍逼退",
      perfection: "正手破陣",
    },
  },
  {
    id: "backhand",
    name: "反手回元掌",
    shot: "反手擊球 Backhand Stroke",
    category: "底線",
    focus: "反手穩定度、回球深度、反手防守與反擊",
    quote: "反手不再是破綻，而是藏於身側的第二道鋒芒。",
    levelTitles: {
      minor_success: "反手不逃",
      subtle: "回元穩拍",
      major_success: "反手破局",
      perfection: "左右無缺",
    },
  },
  {
    id: "third_shot_drop",
    name: "第三拍落雲訣",
    shot: "第三拍 Drop",
    category: "第三拍",
    focus: "放小球、越網高度、落入廚房區、上前銜接",
    quote: "球如落雲，輕墜廚房；一步上前，局勢由此翻轉。",
    levelTitles: {
      minor_success: "落雲初試",
      subtle: "輕墜廚房",
      major_success: "一落開門",
      perfection: "雲落無聲",
    },
  },
  {
    id: "third_shot_drive",
    name: "第三拍破風訣",
    shot: "第三拍 Drive",
    category: "第三拍",
    focus: "第三拍強攻、壓迫對手、製造下一拍機會",
    quote: "一拍破風，不求一擊必殺，只求逼出對手破綻。",
    levelTitles: {
      minor_success: "破風初擊",
      subtle: "快拍壓身",
      major_success: "破風逼退",
      perfection: "一擊開道",
    },
  },
  {
    id: "dink",
    name: "廚房凝氣訣",
    shot: "Dink 小球",
    category: "廚房",
    focus: "小球穩定、過網高度、落點、斜線 Dink、耐心控制",
    quote: "廚房線前不貪殺，凝氣於拍心，勝機藏於一寸落點。",
    levelTitles: {
      minor_success: "廚房不爆衝",
      subtle: "小球入境",
      major_success: "凝氣成線",
      perfection: "廚房主宰",
    },
  },
  {
    id: "crosscourt_dink",
    name: "斜線磨魂功",
    shot: "斜線 Dink",
    category: "廚房",
    focus: "斜線小球、角度、穩定來回、消耗對手",
    quote: "一球斜斜落下，看似溫柔，實則慢慢磨穿對手道心。",
    levelTitles: {
      minor_success: "斜線初磨",
      subtle: "角度入魂",
      major_success: "磨到腳亂",
      perfection: "一線封魂",
    },
  },
  {
    id: "speed_up",
    name: "突襲加速術",
    shot: "Speed-up 加速球",
    category: "攻擊",
    focus: "從 Dink 或中性球突然加速、攻擊時機、攻擊位置",
    quote: "看似溫柔小球，實則暗藏殺機；一念加速，戰局驟變。",
    levelTitles: {
      minor_success: "偶爾偷襲",
      subtle: "看準出手",
      major_success: "一拍變速",
      perfection: "殺機無聲",
    },
  },
  {
    id: "volley",
    name: "斬空截擊手",
    shot: "Volley 截擊",
    category: "攻擊",
    focus: "網前截擊、拍面穩定、封角度、控制回球方向",
    quote: "球未過身，已被斬落；網前一步，便是你的領域。",
    levelTitles: {
      minor_success: "截擊入門",
      subtle: "拍面穩定",
      major_success: "斬空封路",
      perfection: "網前無門",
    },
  },
  {
    id: "hands_battle",
    name: "快手雷音訣",
    shot: "Hands Battle 快速對抽",
    category: "攻擊",
    focus: "手速、反應、近身快球、連續截擊",
    quote: "雷聲未至，拍影已動；快手之境，敵只見殘光。",
    levelTitles: {
      minor_success: "手忙但有救",
      subtle: "快拍跟上",
      major_success: "雷音連斬",
      perfection: "拍影無形",
    },
  },
  {
    id: "counter",
    name: "反擊破甲功",
    shot: "Counter Attack 反擊",
    category: "攻擊",
    focus: "面對對手加速時反擊、借力打力、快球反抽",
    quote: "你敢加速，我便借勢破甲；來球越快，反擊越狠。",
    levelTitles: {
      minor_success: "擋得回去",
      subtle: "借力反抽",
      major_success: "破甲還擊",
      perfection: "以殺止殺",
    },
  },
  {
    id: "reset",
    name: "化勁重置功",
    shot: "Reset 重置",
    category: "防守",
    focus: "把快球、重球化成軟球，讓局面回到中性",
    quote: "敵勢如雷，我自化勁；殺招入拍，轉眼成一顆溫柔小球。",
    levelTitles: {
      minor_success: "勉強擋住",
      subtle: "化快為慢",
      major_success: "重置局勢",
      perfection: "萬力歸柔",
    },
  },
  {
    id: "block",
    name: "半場擋煞訣",
    shot: "Block 防守擋球",
    category: "防守",
    focus: "擋快球、吸收力量、讓球落短、避免被連續攻擊",
    quote: "敵球如煞，我拍如壁；不求反殺，先讓殺意落空。",
    levelTitles: {
      minor_success: "擋煞入門",
      subtle: "拍面不亂",
      major_success: "擋中帶控",
      perfection: "鐵壁化煞",
    },
  },
  {
    id: "lob",
    name: "飛雲高吊術",
    shot: "Lob 高吊球",
    category: "變化",
    focus: "高吊深度、高度、越過對手、攻防轉換",
    quote: "一球飛雲起，逼敵回首退；高吊不是逃，是換一片戰場。",
    levelTitles: {
      minor_success: "勉強過頭",
      subtle: "飛雲有形",
      major_success: "一吊退敵",
      perfection: "雲上藏鋒",
    },
  },
  {
    id: "overhead",
    name: "天雷扣殺訣",
    shot: "Overhead Smash 扣殺",
    category: "終結",
    focus: "高球處理、扣殺角度、力量、落點、穩定收分",
    quote: "高球既現，天雷即落；一拍定劫，不留餘地。",
    levelTitles: {
      minor_success: "有扣有希望",
      subtle: "殺球入界",
      major_success: "天雷落地",
      perfection: "一扣定劫",
    },
  },
];

export const TECHNIQUE_IDS = PICKLEBALL_TECHNIQUES.map((t) => t.id);

export const PRACTICE_MOODS = ["穩", "亂", "爆衝", "手感佳"] as const;
export type PracticeMood = (typeof PRACTICE_MOODS)[number];

export function getTechniqueById(id: string): PickleballTechnique | undefined {
  return PICKLEBALL_TECHNIQUES.find((t) => t.id === id);
}

export function getProficiencyLevel(score: number): ProficiencyLevelKey {
  if (score >= 85) return "perfection";
  if (score >= 60) return "major_success";
  if (score >= 25) return "subtle";
  return "minor_success";
}

export function getProficiencyLevelMeta(level: ProficiencyLevelKey) {
  return PROFICIENCY_LEVELS.find((l) => l.key === level)!;
}

export function getProficiencyLevelName(level: ProficiencyLevelKey): string {
  return getProficiencyLevelMeta(level).name;
}

export function getTechniqueLevelTitle(
  technique: PickleballTechnique,
  level: ProficiencyLevelKey,
): string {
  return technique.levelTitles[level];
}

export function pointsToNextProficiencyLevel(score: number): number | null {
  if (score >= 85) return null;
  if (score >= 60) return 85 - score;
  if (score >= 25) return 60 - score;
  return 25 - score;
}

export function calculateTechniqueExp(input: {
  durationMinutes: number;
  hasNote: boolean;
  hasImprovement: boolean;
  selfRating?: number;
}): number {
  let exp = 0;

  if (input.durationMinutes < 30) {
    exp += 2;
  } else if (input.durationMinutes < 60) {
    exp += 5;
  } else {
    exp += 8;
  }

  if (input.hasNote) exp += 2;
  if (input.hasImprovement) exp += 3;
  if (input.selfRating && input.selfRating >= 4) exp += 2;

  return exp;
}
