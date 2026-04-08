export function formatAzn(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined) return "0 AZN";

  const numericAmount =
    typeof amount === "number"
      ? amount
      : Number(String(amount).replace(/[^\d.-]/g, ""));

  if (!Number.isFinite(numericAmount)) return "0 AZN";

  return `${numericAmount.toLocaleString("en-US")} AZN`;
}