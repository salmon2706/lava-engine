import { h, plural, ROLE_ORDER, ROLES, viewHead } from "../dom.js?v=20261124124457";
import { findingCard, nodeChip } from "./evidence.js?v=20261124124457";
import { proposalLine, RULE, verdict } from "./verdict.js?v=20261124124457";
import { slug } from "./why.js?v=20261124124457";

/* Use it. The four questions, run on a real decision. Worked examples carry
   our own verdict; "Your own" runs the written rule on whatever parts you
   tick. */

const QUESTIONS = [
  "Which part of the engine does it strengthen?",
  "Which chain does it sit on, and is that part a gap or already well covered?",
  "What evidence backs it, from the room and from real sites?",
  "What could break it?",
];

export function useView(root, model, arg) {
  const examples = [...model.decisions.values()];
  let current = model.decisions.get(arg) ?? null;
  let picked = new Set(current ? current.nodes : []);

  const tabs = h("div", { class: "use-tabs" });
  const picker = h("div", { class: "picker" });
  const panel = h("div", { class: "answer" });
  const title = h("input", { class: "use-title", placeholder: "What are you thinking of doing?", oninput: draw });

  root.append(
    viewHead("Use it",
      "Test a decision",
      "Four questions before we start anything. Try one of the calls we have already made, or test your own."),
    h("ol", { class: "four" }, QUESTIONS.map((q) => h("li", {}, q))),
    tabs,
    h("div", { class: "use-grid" },
      h("div", { class: "card use-left" }, title, picker),
      panel),
  );

  function select(d) {
    current = d;
    picked = new Set(d ? d.nodes : []);
    title.value = d ? d.title : "";
    history.replaceState(null, "", d ? `#use/${d.id}` : "#use");
    draw();
  }

  function draw() {
    tabs.replaceChildren(
      ...examples.map((d) => h("button", {
        class: "btn", type: "button", "aria-pressed": current === d ? "true" : "false", onclick: () => select(d),
      }, d.title)),
      h("button", { class: "btn", type: "button", "aria-pressed": current ? "false" : "true", onclick: () => select(null) }, "Your own"),
    );
    picker.replaceChildren(...ROLE_ORDER.map((role) => h("div", { class: "pick-col", "--c": ROLES[role].colour },
      h("div", { class: "pick-head" }, h("span", { class: "role-dot" }), ROLES[role].name),
      model.spine.nodes.filter((n) => n.role === role).map((n) => h("button", {
        class: "pick", type: "button", "aria-pressed": picked.has(n.id) ? "true" : "false",
        onclick: () => {
          if (picked.has(n.id)) picked.delete(n.id);
          else picked.add(n.id);
          if (current) {
            current = null;
            history.replaceState(null, "", "#use");
          }
          draw();
        },
      }, n.label)))));
    panel.replaceChildren(answer(model, [...picked], current, title.value));
  }

  if (current) title.value = current.title;
  draw();
}

function answer(model, ids, example, titleText) {
  const v = verdict(model, ids);
  const shown = example ? example.verdict : v.verdict;
  const line = proposalLine(model, ids, { ...v, verdict: shown });
  const st = ids.map((id) => model.stats(id));
  const words = st.reduce((t, x) => t + x.words, 0);
  const findings = model.evidence.filter((e) => e.nodes.some((n) => ids.includes(n)));
  return h("div", { class: "card answer-card fade-in" },
    h("span", { class: `verdict v-${slug(shown)}` }, shown),
    h("h2", {}, titleText || "Your decision"),
    example ? h("p", { class: "answer-why" }, example.why) : null,
    q(1, ids.length ? h("div", { class: "chips" }, ids.map((id) => nodeChip(model, id))) : h("p", { class: "muted" }, "Nothing ticked yet.")),
    q(2, v.chains.length
      ? h("div", { class: "chips" }, v.chains.map(({ chain, joined }) =>
        h("a", { class: `btn${joined ? " joined" : ""}`, href: `#loop/${chain.id}` }, chain.title)))
      : null,
    h("ul", { class: "reasons" }, v.reasons.map((r) => h("li", {}, r)))),
    q(3, h("p", {}, ids.length
      ? `${plural(words, "word")} from the room behind these parts. ${findings.length ? plural(findings.length, "finding") : "Nothing yet"} from real sites.`
      : "No room evidence until a part is ticked."),
    findings.map((e) => findingCard(model, e)),
    example && !findings.length ? h("p", { class: "since" }, h("strong", {}, "Since the day: "), example.evidence) : null),
    q(4, v.warn
      ? h("div", { class: "check-card" },
        h("div", { class: "eyebrow" }, `David's check`),
        h("strong", {}, `"${v.warn.word}"`),
        h("span", { class: "muted" }, v.warn.line))
      : h("p", { class: "muted" }, "Nothing in the room's words argues against it. Ask who it could go wrong for.")),
    h("div", { class: "proposal" },
      h("div", { class: "eyebrow" }, "Put this at the top of the proposal"),
      h("p", {}, line),
      h("button", { class: "btn", type: "button", onclick: (e) => copy(line, e.currentTarget) }, "Copy")),
    example ? null : h("details", { class: "rule" },
      h("summary", {}, "How this verdict is worked out"),
      h("ol", {}, RULE.map((r) => h("li", {}, r))),
      h("p", { class: "muted" }, model.bundle.attention.source)),
  );
}

function q(n, ...content) {
  return h("section", { class: "q" }, h("h3", {}, h("span", {}, String(n)), QUESTIONS[n - 1]), ...content);
}

async function copy(text, btn) {
  await navigator.clipboard?.writeText(text).catch(() => null);
  btn.textContent = "Copied";
  window.setTimeout(() => { btn.textContent = "Copy"; }, 1600);
}
