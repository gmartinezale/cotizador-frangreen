export default function formatCurrency(
  value: number,
  locale = "es-CL",
  currency = "CLP",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}
