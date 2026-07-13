const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number): string {
  return INR_FORMATTER.format(amount);
}

export function formatWeight(grams: number): string {
  return `${grams.toFixed(2)} g`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatDate(iso: string | Date): string {
  return DATE_FORMATTER.format(new Date(iso));
}
