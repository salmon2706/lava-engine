import { ROLES } from "../dom.js?v=20261124101623";

/* The test, as a pure function, so the rule is written down in one place
   and shown to the user word for word (RULE below). Input: the engine parts
   a piece of work strengthens. Output: the verdict and its reasons. */

export const RULE = [
  "Touches no part of the engine: not on the engine. Fine for running the company (books, EIS, payroll, legal); otherwise ask what it is for.",
  "Touches a part marked as a gap: fills a gap.",
  "Touches only parts that are well covered: check first. Is this the cheapest way to move a weaker part?",
  "Anything else: on the engine.",
  "Whatever the verdict, anything that relies on reuse being frictionless gets David's check.",
];

const FRICTION = new Set(["cup", "engage", "sell"]);

export function verdict(model, ids) {
  if (ids.length === 0) {
    return { verdict: "Not on the engine", reasons: [RULE[0]], gaps: [], covered: [], chains: [], warn: null };
  }
  const levels = ids.map((id) => [id, model.attention(id).level]);
  const gaps = levels.filter(([, l]) => l === "gap").map(([id]) => id);
  const covered = levels.filter(([, l]) => l === "covered").map(([id]) => id);
  const chains = chainsFor(model, ids);
  let v = "On the engine";
  if (gaps.length) v = "Fills a gap";
  else if (covered.length === ids.length) v = "Check first";
  const reasons = [];
  if (gaps.length) reasons.push(`${names(model, gaps)}: ${gaps.length === 1 ? "a gap" : "gaps"} today.`);
  if (covered.length) reasons.push(`${names(model, covered)}: already well covered.`);
  const joined = chains.filter((c) => c.joined);
  if (joined.length) reasons.push(`Joins up a chain the room walked: ${joined.map((c) => c.chain.title).join("; ")}.`);
  else if (chains.length) reasons.push(`Sits on ${chains.map((c) => c.chain.title).join("; ")}.`);
  else reasons.push("Not on any chain the room walked. Say which link it makes.");
  const warn = ids.some((id) => FRICTION.has(id)) ? model.spine.check : null;
  return { verdict: v, reasons, gaps, covered, chains, warn };
}

function chainsFor(model, ids) {
  const set = new Set(ids);
  return [...model.chains.values()]
    .map((chain) => {
      const hops = [...model.hops(chain), ...(chain.feeds ?? [])];
      const on = [...chain.nodes, ...(chain.feeds ?? []).flat()].some((n) => set.has(n));
      const joined = hops.some(([a, b]) => set.has(a) && set.has(b));
      return on ? { chain, joined } : null;
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.joined) - Number(a.joined));
}

function names(model, ids) {
  return ids.map((id) => model.node(id).label).join(", ");
}

export function proposalLine(model, ids, v) {
  if (!ids.length) return "Engine: not on the engine (company running).";
  const parts = ids.map((id) => {
    const n = model.node(id);
    return `${n.label} (${ROLES[n.role].short.toLowerCase()})`;
  });
  const chain = v.chains[0]?.chain.title;
  return `Engine: strengthens ${parts.join(", ")}${chain ? `. Chain: ${chain}` : ""}. Verdict: ${v.verdict.toLowerCase()}.`;
}
