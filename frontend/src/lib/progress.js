// Progress figures for the Progress page. Everything here is computed from
// real records: marked OSCE attempts from the server, and the MCQ / OSPE
// practice results the MCQ and OSPE pages already save in this browser.

const DAY = 24 * 60 * 60 * 1000;

function readLocal(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

const average = (list) => (list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null);
const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

// ---- OSCE ----
export function osceSummary(attempts, stations) {
  const marked = attempts
    .filter((a) => Number.isFinite(a.finalScore?.percentage) && a.module)
    .map((a) => ({ ...a, pct: Math.round(a.finalScore.percentage), at: new Date(a.endedAt || a.startedAt) }))
    .sort((a, b) => a.at - b.at);

  const recent = marked.slice(-10).map((a) => a.pct);
  const previous = marked.slice(-20, -10).map((a) => a.pct);
  const recentAvg = average(recent);
  const previousAvg = previous.length >= 3 ? average(previous) : null;
  const uniqueStations = new Set(marked.map((a) => String(a.module.id || a.module.slug)));

  // Practice days in a row, counting back from today (or yesterday).
  const days = new Set(marked.map((a) => dayKey(a.at)));
  let streak = 0;
  let cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor = new Date(cursor.getTime() - DAY);
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - DAY);
  }

  // Stations marked per week, oldest first, for the last 8 weeks.
  const now = Date.now();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = now - (7 - i) * 7 * DAY;
    const start = end - 7 * DAY;
    return marked.filter((a) => a.at.getTime() > start && a.at.getTime() <= end).length;
  });

  // Specialties: totals from the station bank, results from attempts.
  const bySpecialty = new Map();
  for (const s of stations) {
    const name = s.specialty?.name || "General";
    if (!bySpecialty.has(name)) bySpecialty.set(name, { name, total: 0, practised: new Set(), scores: [] });
    bySpecialty.get(name).total += 1;
  }
  for (const a of marked) {
    const name = a.module.specialty?.name || "General";
    if (!bySpecialty.has(name)) bySpecialty.set(name, { name, total: 0, practised: new Set(), scores: [] });
    const row = bySpecialty.get(name);
    row.practised.add(String(a.module.id || a.module.slug));
    row.scores.push(a.pct);
  }
  const specialties = [...bySpecialty.values()]
    .map((r) => ({ name: r.name, total: Math.max(r.total, r.practised.size), practised: r.practised.size, avg: average(r.scores), attempts: r.scores.length }))
    .sort((a, b) => b.attempts - a.attempts || a.name.localeCompare(b.name));

  // Checklist items missed most often, with the stations they came from.
  const missed = new Map();
  for (const a of marked) {
    for (const item of new Set(a.missedItems || [])) {
      if (!missed.has(item)) missed.set(item, { item, count: 0, stations: new Map() });
      const row = missed.get(item);
      row.count += 1;
      row.stations.set(a.module.slug, a.module.title);
    }
  }
  const missedItems = [...missed.values()]
    .sort((a, b) => b.count - a.count || a.item.localeCompare(b.item))
    .slice(0, 6)
    .map((r) => ({ ...r, stations: [...r.stations].map(([slug, title]) => ({ slug, title })) }));

  return {
    marked,
    count: marked.length,
    uniqueCount: uniqueStations.size,
    stationTotal: stations.length,
    recentAvg,
    previousAvg,
    best: marked.length ? Math.max(...marked.map((a) => a.pct)) : null,
    minutes: Math.round(marked.reduce((sum, a) => sum + (a.elapsedSeconds || 0), 0) / 60),
    streak,
    weeks,
    trend: marked.slice(-20).map((a) => a.pct),
    specialties,
    missedItems,
    recent: [...marked].reverse().slice(0, 5),
  };
}

// ---- MCQ ----
// Question ids are "y<year>-q<n>", numbered through the year in block and
// topic order, the same scheme the MCQ pages use.
// mcqYears / ospeYears come from the content catalog (lib/content.js).
export function mcqSummary(mcqYears = []) {
  const progress = readLocal("kf_mcq_progress");
  const years = mcqYears.map((year) => {
    let offset = 0;
    let answered = 0;
    let correct = 0;
    const topics = [];
    for (const block of year.blocks) {
      for (const topic of block.topics) {
        let a = 0;
        let c = 0;
        for (let n = offset + 1; n <= offset + topic.count; n += 1) {
          const v = progress[`y${year.year}-q${n}`];
          if (v !== undefined) {
            a += 1;
            c += v;
          }
        }
        offset += topic.count;
        answered += a;
        correct += c;
        topics.push({ yearSlug: year.slug, yearName: year.name, blockSlug: block.slug, topicSlug: topic.slug, name: topic.name, answered: a, correct: c, total: topic.count });
      }
    }
    return { slug: year.slug, name: year.name, total: year.count, answered, correct, topics };
  });
  const answered = years.reduce((s, y) => s + y.answered, 0);
  const correct = years.reduce((s, y) => s + y.correct, 0);
  const weakTopics = years
    .flatMap((y) => y.topics)
    .filter((t) => t.answered >= 5)
    .map((t) => ({ ...t, accuracy: Math.round((t.correct / t.answered) * 100) }))
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered)
    .slice(0, 4);
  return { years, answered, correct, accuracy: answered ? Math.round((correct / answered) * 100) : null, weakTopics };
}

// ---- OSPE ----
// Station ids are "ospe<year>-<block slug>-<n>"; values are the fraction of
// checklist items ticked on the latest attempt.
export function ospeSummary(ospeYears = []) {
  const progress = readLocal("kf_ospe_progress");
  const entries = Object.entries(progress);
  const years = ospeYears.map((year) => {
    const prefix = `ospe${year.year}-`;
    const mine = entries.filter(([id]) => id.startsWith(prefix));
    const blocks = year.blocks.map((block) => {
      const scores = mine.filter(([id]) => id.startsWith(`${prefix}${block.slug}-`)).map(([, v]) => v * 100);
      return { slug: block.slug, name: block.name, total: block.count, attempted: scores.length, avg: average(scores) };
    });
    return { slug: year.slug, name: year.name, total: year.count, attempted: mine.length, avg: average(mine.map(([, v]) => v * 100)), blocks };
  });
  const attempted = entries.length;
  return { years, attempted, avg: average(entries.map(([, v]) => v * 100)) };
}
