import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { SectionHeader } from "../components/SectionHeader";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md">
        <Card>
          <SectionHeader
            title="Pathfinder"
            subtitle="A personal guide for finding your next right step."
          />

          <div className="mt-10">
            <Button>Get Started</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}