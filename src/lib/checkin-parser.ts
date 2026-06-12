import type { AttendeeCategory, SportType } from "@/types/checkin";

export type ParsedAttendee = {
  name: string;
  category: AttendeeCategory;
  listNumber: number | null;
};

export type ParsedCheckIn = {
  eventDate: string | null;
  title: string;
  timeRange: string;
  venue: string;
  feeAmount: number;
  sportType: SportType;
  notes: string;
  attendees: ParsedAttendee[];
};

/** 空行分段：第1段打球、第2段練球、第3段候補… */
const BLOCK_CATEGORIES: AttendeeCategory[] = [
  "play",
  "practice",
  "waitlist_play",
  "waitlist_practice",
];

const SECTION_MARKERS: { pattern: RegExp; category: AttendeeCategory }[] = [
  { pattern: /歡樂區|接龍.*如下|^打球/, category: "play" },
  { pattern: /^練球區/, category: "practice" },
  { pattern: /額滿候補|報名請.*候補/, category: "waitlist_play" },
  { pattern: /^候補如下/, category: "waitlist_practice" },
];

const SKIP_LINE =
  /^(時間|地點|使用球|球費|規則|報名請|#|協助餵球|---|\s*$)|元\s*\/人|遵守再報名/;

function cleanName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/** 從一行取出「1.名字  2.名字」 */
export function extractNamesFromLine(
  line: string,
): { num: number; name: string }[] {
  const results: { num: number; name: string }[] = [];
  const pattern = /(\d+)\s*\.?\s*([^0-9]+?)(?=\s+\d+\s*\.|$)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    const name = cleanName(match[2]);
    if (name) results.push({ num: parseInt(match[1], 10), name });
  }

  return results;
}

function hasNumberedNames(text: string): boolean {
  return /\d+\s*\.?\s*\S/.test(text);
}

function namesFromLines(lines: string[]): { num: number; name: string }[] {
  const out: { num: number; name: string }[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (!t || SKIP_LINE.test(t)) continue;
    if (SECTION_MARKERS.some((m) => m.pattern.test(t))) continue;
    out.push(...extractNamesFromLine(t));
  }
  return out;
}

function parsePaused(text: string): ParsedAttendee[] {
  const out: ParsedAttendee[] = [];
  for (const line of text.split("\n")) {
    if (!/暫停/.test(line) || !/[+＋]/.test(line)) continue;
    const body = line.replace(/暫停.*$/, "").trim();
    for (const part of body.split(/[+＋]/)) {
      const name = cleanName(part);
      if (name) out.push({ name, category: "paused", listNumber: null });
    }
  }
  return out;
}

/** 簡易模式：空行分段 */
function parseByBlocks(text: string): ParsedAttendee[] {
  const blocks = text
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter((b) => hasNumberedNames(b));

  if (blocks.length === 0) return [];

  return blocks.flatMap((block, index) => {
    const category =
      blocks.length === 1 ? "play" : (BLOCK_CATEGORIES[index] ?? "play");
    return namesFromLines(block.split("\n")).map(({ num, name }) => ({
      name,
      category,
      listNumber: num,
    }));
  });
}

/** 完整貼文：依區塊標題切換 */
function parseBySections(text: string): ParsedAttendee[] {
  let category: AttendeeCategory = "play";
  const out: ParsedAttendee[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const marker = SECTION_MARKERS.find((m) => m.pattern.test(line));
    if (marker) {
      category = marker.category;
      continue;
    }

    if (SKIP_LINE.test(line) || /^規則/.test(line)) continue;

    for (const { num, name } of extractNamesFromLine(line)) {
      out.push({ name, category, listNumber: num });
    }
  }

  return out;
}

function parseMeta(text: string, sportHint: SportType) {
  const dateMatch = text.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  const year = new Date().getFullYear();
  const eventDate = dateMatch
    ? `${year}-${dateMatch[1].padStart(2, "0")}-${dateMatch[2].padStart(2, "0")}`
    : null;

  const titleLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && /\d{1,2}\s*\/\s*\d{1,2}/.test(l));

  return {
    eventDate,
    title: titleLine ?? "",
    timeRange: text.match(/時間[：:]\s*(.+)/)?.[1]?.trim() ?? "",
    venue: text.match(/地點[：:]\s*(.+)/)?.[1]?.trim() ?? "",
    feeAmount: parseInt(text.match(/球費[：:]\s*(\d+)/)?.[1] ?? "200", 10),
    sportType: /羽球|🏸|奧本/i.test(text)
      ? ("badminton" as SportType)
      : /pick|匹克|星鑽/i.test(text)
        ? ("pickleball" as SportType)
        : sportHint,
    notes: "",
  };
}

function dedupe(list: ParsedAttendee[]): ParsedAttendee[] {
  const seen = new Set<string>();
  return list.filter((a) => {
    const key = `${a.category}:${a.name}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseRegistrationText(
  rawText: string,
  sportHint: SportType = "badminton",
): ParsedCheckIn {
  const text = rawText.replace(/\r\n/g, "\n").trim();
  const meta = parseMeta(text, sportHint);
  const paused = parsePaused(text);

  const useSections = /歡樂區|練球區|接龍|額滿候補|候補如下/.test(text);
  const fromList = useSections ? parseBySections(text) : parseByBlocks(text);
  const attendees = dedupe([...fromList, ...paused]);

  return { ...meta, attendees };
}

export function mergeAttendeesDedupe(
  ...lists: ParsedAttendee[][]
): ParsedAttendee[] {
  const seen = new Set<string>();
  const result: ParsedAttendee[] = [];
  for (const list of lists) {
    for (const a of list) {
      const key = a.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push({ ...a, name: a.name.trim() });
    }
  }
  return result;
}

export function groupAttendeesByCategory(attendees: ParsedAttendee[]) {
  const groups: Record<AttendeeCategory, ParsedAttendee[]> = {
    play: [],
    practice: [],
    waitlist_play: [],
    waitlist_practice: [],
    paused: [],
  };
  for (const a of attendees) groups[a.category].push(a);
  return groups;
}
