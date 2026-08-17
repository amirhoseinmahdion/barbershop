const foundations = [
  "Discover men's, women's, and unisex salons",
  "Choose services and available appointment times",
  "Manage schedules and reservations from the salon dashboard",
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
      <section className="w-full rounded-3xl border border-stone-200 bg-white p-8 shadow-sm md:p-14">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">
          Project foundation
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-stone-900 md:text-6xl">
          A better way to find and reserve your next salon visit.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
          The client is running. Authentication, salon discovery, schedules, and reservations will be added feature by feature.
        </p>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {foundations.map((foundation) => (
            <li key={foundation} className="rounded-2xl bg-stone-100 p-5 text-sm leading-6 text-stone-700">
              {foundation}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

