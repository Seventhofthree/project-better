import type { ReactNode } from "react";
import { theme } from "../lib/theme";

type ButtonProps = {
  children: ReactNode;
};

export function Button({ children }: ButtonProps) {
  return (
    <button
      className="w-full px-6 py-4 text-lg font-semibold text-white transition active:scale-[0.99]"
      style={{
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.button,
      }}
    >
      {children}
    </button>
  );
}