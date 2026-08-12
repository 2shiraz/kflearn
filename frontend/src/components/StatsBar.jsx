const stats = [
  { value: "200+", label: "Clinical stations" },
  { value: "12", label: "Specialties covered" },
  { value: "AI-powered", label: "Checklist evaluation" },
  { value: "Free", label: "Core access" },
];

export default function StatsBar() {
  return (
    <section className="border-y border-line bg-white/45 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4 lg:px-10">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{s.value}</p>
            <p className="mt-1 text-sm text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
