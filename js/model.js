/* Indexes over the decrypted bundle. Every count shown in the app is read
   from here, and every count here is read from the room's own data. */

export function makeModel(bundle) {
  const { spine, data } = bundle;
  const nodes = new Map(spine.nodes.map((n) => [n.id, n]));
  const words = new Map(data.words.map((w) => [w.id, w]));
  const linkKey = (a, b) => `${a}>${b}`;
  const links = new Map(data.links.map((l) => [linkKey(l.from, l.to), l]));
  const chains = new Map(bundle.chains.map((c) => [c.id, c]));
  const decisions = new Map(bundle.decisions.map((d) => [d.id, d]));

  function wordsOf(spineId) {
    return data.words.filter((w) => w.spine === spineId).sort((a, b) => b.votes - a.votes);
  }

  function stats(spineId) {
    const ws = wordsOf(spineId);
    return {
      words: ws.length,
      votes: ws.reduce((t, w) => t + w.votes, 0),
      people: new Set(ws.map((w) => w.by)).size,
    };
  }

  function link(a, b) {
    return links.get(linkKey(a, b)) ?? null;
  }

  function touching(spineId) {
    return data.links
      .filter((l) => l.from === spineId || l.to === spineId)
      .map((l) => ({ link: l, out: l.from === spineId, other: l.from === spineId ? l.to : l.from }))
      .sort((x, y) => y.link.phrases.length - x.link.phrases.length);
  }

  function concepts(spineId) {
    return data.concepts.filter((c) => c.spine === spineId).sort((a, b) => b.words.length - a.words.length);
  }

  function hops(chain) {
    const n = chain.nodes;
    const pairs = n.slice(1).map((b, i) => [n[i], b]);
    if (chain.loop) pairs.push([n[n.length - 1], n[0]]);
    return pairs;
  }

  function chainsWith(spineId) {
    return bundle.chains.filter(
      (c) => c.nodes.includes(spineId) || (c.feeds ?? []).some((f) => f.includes(spineId)),
    );
  }

  function attention(spineId) {
    const [level, note] = bundle.attention.nodes[spineId];
    return { level, note, label: bundle.attention.levels[level] };
  }

  const outside = data.concepts.filter((c) => !c.spine);
  const evidence = [...bundle.evidence.items].sort((a, b) => b.date.localeCompare(a.date));

  function evidenceFor(spineId) {
    return evidence.filter((e) => e.nodes.includes(spineId));
  }

  function sites() {
    return [...new Set(evidence.map((e) => e.site))];
  }

  return {
    bundle,
    meta: bundle.meta,
    story: bundle.story,
    spine,
    nodes,
    node: (id) => nodes.get(id),
    word: (id) => words.get(id),
    words: data.words,
    steps: data.steps,
    people: data.people,
    chains,
    decisions,
    outside,
    wordsOf,
    stats,
    link,
    touching,
    concepts,
    hops,
    chainsWith,
    attention,
    evidence,
    evidenceFor,
    sites,
  };
}
