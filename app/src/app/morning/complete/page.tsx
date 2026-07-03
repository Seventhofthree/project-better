import Link from "next/link";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { theme } from "../../../lib/theme";

export default function MorningComplete() {
  return (
    <main
      className="min-h-screen p-6"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="mx-auto max-w-md">
        <div className="pt-24">
          <Card>
            <p className="text-lg" style={{ color: theme.colors.textSecondary }}>
              Morning Routine
            </p>

            <h1
              className="mt-2 text-4xl font-bold tracking-tight"
              style={{ color: theme.colors.textPrimary }}
            >
              Morning Complete.
            </h1>

            <p
              className="mt-6 text-base leading-7"
              style={{ color: theme.colors.textSecondary }}
            >
              Nice work. Your morning care is done.
            </p>

            <div className="mt-8">
              <Link href="/home">
                <Button>Return Home</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}