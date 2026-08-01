/** 空行や括弧だけの行は誤選択とみなさない（採点・検証で共通） */
export function isIgnorableLine(code: string): boolean {
  const trimmed = code.trim();
  return (
    trimmed === "" ||
    trimmed === "{" ||
    trimmed === "}" ||
    trimmed === "};" ||
    trimmed === "},"
  );
}

/** 実質的なコード行か（空・括弧のみでない） */
export function isSubstantiveLine(code: string): boolean {
  return !isIgnorableLine(code);
}
