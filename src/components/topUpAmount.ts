import { decimalToMinorUnits, formatMinorUnits } from "@/utils/amount";

export function toMinorUnits(val: number | string): bigint {
  if (typeof val === "number") {
    if (!Number.isFinite(val) || val <= 0) return 0n;
  }

  if (typeof val === "string" && (!val.trim() || val.trim() === ".")) return 0n;
  return decimalToMinorUnits(val, 7);
}

export function formatDisplayAmount(val: number): string {
  return formatMinorUnits(decimalToMinorUnits(val, 7), 7, 2);
}
