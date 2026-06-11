/** 易混淆字元（DUPR ID 常見 O/0、I/1） */
const CONFUSABLE: Record<string, readonly string[]> = {
  "0": ["O"],
  O: ["0"],
  "1": ["I", "L"],
  I: ["1", "L"],
  L: ["1", "I"],
};

export function normalizeDuprId(id: string): string {
  return id.trim().toUpperCase();
}

/** 是否為同一 DUPR ID（含 O/0、I/1 等易混淆字元） */
export function areDuprIdsEquivalent(a: string, b: string): boolean {
  const left = normalizeDuprId(a);
  const right = normalizeDuprId(b);
  if (left === right) return true;
  if (left.length !== right.length) return false;

  let mismatches = 0;
  for (let i = 0; i < left.length; i++) {
    if (left[i] === right[i]) continue;
    const aliases = CONFUSABLE[left[i]];
    if (aliases?.includes(right[i])) {
      mismatches += 1;
      continue;
    }
    return false;
  }

  return mismatches > 0;
}
