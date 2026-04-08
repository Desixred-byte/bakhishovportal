export function formatAzn(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined) return "₼0";

  const numericAmount =
    typeof amount === "number"
      ? amount
      : Number(String(amount).replace(/[^\d.-]/g, ""));

  if (!Number.isFinite(numericAmount)) return "₼0";

  return `₼${numericAmount.toLocaleString("en-US")}`;
}