export const SAMPLE_PRIMARY_COLORS = [
  "#FF8A65",
  "#FD9B3C",
  "#E0B20C",
  "#3FD599",
  "#81C784",
  "#4DB6AC",
  "#4DD0E1",
  "#64B5F6",
  "#655DFF",
  "#9575CD",
  "#BA68C8",
  "#FF91D5",
  "#F06292",
  "#D7B59E",
] as const;

export function pickPrimaryColor(random: () => number = Math.random): string {
  return SAMPLE_PRIMARY_COLORS[Math.floor(random() * SAMPLE_PRIMARY_COLORS.length)];
}
