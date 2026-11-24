const STROOPS_PER_UNIT = 10_000_000n;

export function toMinorUnits(val: number | string): bigint {
  if (typeof val === "number") {
    if (!Number.isFinite(val) || val <= 0) return 0n;
    const s = val.toFixed(7);
    const [intPart, fracPart] = s.split(".");
    return BigInt(intPart) * STROOPS_PER_UNIT + BigInt(fracPart || "0");
  }
  const trimmed = val.trim();
  if (!trimmed || trimmed === ".") return 0n;
  const [intPart, fracPart = ""] = trimmed.split(".");
  const safeInt = intPart === "" ? 0n : BigInt(intPart);
  const safeFrac = BigInt(fracPart.slice(0, 7).padEnd(7, "0"));
  return safeInt * STROOPS_PER_UNIT + safeFrac;
}

export function formatDisplayAmount(val: number): string {
  const s = val.toFixed(7).replace(/0+$/, "");
  const parts = s.split(".");
  if (parts.length === 1) return `${parts[0]}.00`;
  if (parts[1].length < 2) return `${parts[0]}.${parts[1].padEnd(2, "0")}`;
  return s;
}
