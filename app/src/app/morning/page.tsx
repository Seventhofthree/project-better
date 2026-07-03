import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { theme } from "../../lib/theme";

export default function MorningRoutine() {
  return (
    <main
      className="min-h-screen p-6"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="mx-auto max-w-md">
        <header className="pt-6">
          <p className="text-lg" style={{ color: theme.colors.textSecondary }}>
            Morning Routine
          </p>

          <h1
            className="mt-1 text-4xl font-bold tracking-tight"
            style={{ color: theme.colors.textPrimary }}
          >
            Brush Teeth
          </h1>
        </header>

        <div className="mt-8">
          <Card>
            <p className="text-base" style={{ color: theme.colors.textSecondary }}>
              Philips Sonicare + toothpaste
            </p>

            <p className="mt-4 text-base" style={{ color: theme.colors.textSecondary }}>
              Estimated time: 2 minutes
            </p>

            <div className="mt-8">
              <Button>Done</Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}