import { theme } from "../lib/theme";

type StatusRowProps = {
  label: string;
  status?: "complete" | "upcoming";
};

export function StatusRow({ label, status = "upcoming" }: StatusRowProps) {
  const marker = status === "complete" ? "✓" : "○";

  return (
    <div className="flex items-center justify-between text-lg">
      <span style={{ color: theme.colors.textPrimary }}>{label}</span>
      <span style={{ color: theme.colors.textSecondary }}>{marker}</span>
    </div>
  );
}