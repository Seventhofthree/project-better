import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { theme } from "../../lib/theme";

export default function HomeDashboard() {
  return (
    <main
      className="min-h-screen p-6"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="mx-auto max-w-md">
        <header className="pt-6">
          <p className="text-lg" style={{ color: theme.colors.textSecondary }}>
            Good Evening,
          </p>

          <h1
            className="mt-1 text-4xl font-bold tracking-tight"
            style={{ color: theme.colors.textPrimary }}
          >
            Joshua
          </h1>

          <p className="mt-3 text-sm" style={{ color: theme.colors.textSecondary }}>
            Wednesday
            <br />
            July 2, 2026
          </p>
        </header>

        <div className="mt-8">
          <Card>
            <p
              className="text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: theme.colors.textSecondary }}
            >
              Today&apos;s Path
            </p>

            <h2
              className="mt-4 text-2xl font-bold"
              style={{ color: theme.colors.textPrimary }}
            >
              Morning Routine
            </h2>

            <p className="mt-2 text-base" style={{ color: theme.colors.textSecondary }}>
              Estimated time: 4 minutes
            </p>

            <div className="mt-6">
              <Button>Begin Morning Routine</Button>
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <p
              className="text-xs font-semibold uppercase tracking-[0.25em]"
              style={{ color: theme.colors.textSecondary }}
            >
              Today
            </p>

            <div className="mt-5 space-y-4 text-lg">
              <div>○ Workout</div>
              <div>○ Meal Plan</div>
              <div>○ Night Routine</div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}