export default function HomeDashboard() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-md">

        <h1 className="text-3xl font-bold text-slate-900">
          Good Evening, Joshua
        </h1>

        <p className="mt-1 text-slate-500">
          Wednesday • July 2
        </p>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow">

          <p className="text-sm uppercase tracking-widest text-slate-400">
            Next
          </p>

          <h2 className="mt-2 text-2xl font-semibold">
            🪥 Morning Routine
          </h2>

          <p className="mt-2 text-slate-500">
            About 4 minutes
          </p>

          <button className="mt-6 w-full rounded-2xl bg-emerald-700 py-4 text-lg font-semibold text-white">
            Start
          </button>

        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow">

          <p className="text-sm uppercase tracking-widest text-slate-400">
            Today
          </p>

          <ul className="mt-4 space-y-3 text-lg">
            <li>○ Workout</li>
            <li>○ Meal Plan</li>
            <li>○ Night Routine</li>
          </ul>

        </section>

      </div>
    </main>
  );
}