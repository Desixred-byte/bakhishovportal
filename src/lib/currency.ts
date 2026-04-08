export function formatAzn(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined) return "AZN 0";

  const numericAmount =
    typeof amount === "number"
      ? amount
      : Number(String(amount).replace(/[^\d.-]/g, ""));

  if (!Number.isFinite(numericAmount)) return "AZN 0";

  return `AZN ${numericAmount.toLocaleString("en-US")}`;
}