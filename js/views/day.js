import { h, plural, ROLES, viewHead } from "../dom.js?v=20261124124457";
import { openNode } from "./evidence.js?v=20261124124457";

/* The day, replayed. Every one of the 51 steps exactly as it happened: the
   word on the screen, every word the room offered under it, who said each,
   how the votes fell, and which one the room chose to follow next. */

const PLAY_MS = 2600;

export function dayView(root, model, arg) {
  const steps = model.steps;
  let i = Math.min(steps.length - 1, Math.max(0, Number(arg) - 1 || 0));
  let timer = null;

  const trail = h("div", { class: "trail" });
  const stage = h("div", { class: "day-stage card" });
  const slider = h("input", {
    type: "range", min: "1", max: String(steps.length), value: String(i + 1),
    class: "day-slider", "aria-label": "Step",
    oninput: (e) => go(Number(e.target.value) - 1),
  });
  const play = h("button", { class: "btn primary", type: "button", onclick: toggle }, "Play the day");
  const counter = h("span", { class: "day-count" });

  root.append(
    viewHead("16th September, 09:20 to 12:40",
      "The day, step by step",
      "Starting from Lava Labs, everyone typed the word the screen made them think of, then voted on where to go next. Replay it."),
    h("div", { class: "day-controls" },
      h("button", { class: "btn", type: "button", onclick: () => go(i - 1) }, "Back"),
      play,
      h("button", { class: "btn", type: "button", onclick: () => go(i + 1) }, "Next"),
      slider, counter),
    trail,
    stage,
  );

  function toggle() {
    if (timer) return stop();
    if (i >= steps.length - 1) go(0);
    play.textContent = "Pause";
    timer = window.setInterval(() => (i >= steps.length - 1 ? stop() : go(i + 1)), PLAY_MS);
  }

  function stop() {
    window.clearInterval(timer);
    timer = null;
    play.textContent = "Play the day";
  }

  function go(next) {
    i = Math.min(steps.length - 1, Math.max(0, next));
    slider.value = String(i + 1);
    counter.textContent = `Step ${i + 1} of ${steps.length}`;
    history.replaceState(null, "", `#day/${i + 1}`);
    draw();
  }

  function draw() {
    const step = steps[i];
    const word = model.word(step.word);
    trail.replaceChildren(...steps.slice(0, i + 1).map((st, k) => h("button", {
      class: `crumb${k === i ? " now" : ""}`, type: "button", onclick: () => go(k),
    }, model.word(st.word).text)));
    trail.lastChild?.scrollIntoView({ block: "nearest", inline: "end" });
    const offered = step.offered.map((id) => model.word(id)).sort((a, b) => b.votes - a.votes);
    const maxVotes = Math.max(1, ...offered.map((w) => w.votes));
    stage.replaceChildren(
      h("div", { class: "now-word fade-in" },
        h("span", { class: "eyebrow" }, "On the screen"),
        h("h2", {}, word.text),
        h("span", { class: "muted" }, word.by === "start" ? "Where we started" : `Said by ${word.by}`)),
      offered.length
        ? h("div", { class: "offered" }, offered.map((w) => offer(model, w, w.id === step.chosen, maxVotes)))
        : h("p", { class: "muted day-end" }, "Where the morning ended."),
    );
  }

  go(i);
  window.addEventListener("hashchange", stop, { once: true });
}

function offer(model, w, chosen, maxVotes) {
  const node = w.spine ? model.node(w.spine) : null;
  return h("div", { class: `offer card${chosen ? " chosen" : ""}` },
    chosen ? h("span", { class: "chosen-tag" }, "The room went here") : null,
    h("strong", {}, w.text),
    h("span", { class: "w-by" }, w.by),
    h("span", { class: "vote-bar" }, h("i", { style: { width: `${(w.votes / maxVotes) * 100}%` } })),
    h("span", { class: "muted small" }, plural(w.votes, "vote")),
    node
      ? h("button", { class: "offer-node", type: "button", "--c": ROLES[node.role].colour, onclick: () => openNode(model, node.id) },
        h("span", { class: "role-dot" }), node.label)
      : null,
  );
}
