import type { ReactNode } from "react";
import { theme } from "../lib/theme";

type CardProps = {
  children: ReactNode;
};

export function Card({ children }: CardProps) {
  return (
    <section
      className="w-full p-8"
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.card,
        boxShadow: theme.shadow.card,
        border: `1px solid ${theme.colors.border}`,
      }}
    >
      {children}
    </section>
  );
}