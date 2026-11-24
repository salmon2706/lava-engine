import { deriveKey, forgetKey, keepKey, keptKey, openSealed } from "./crypto.js?v=20261124101623";
import { h } from "./dom.js?v=20261124101623";
import { makeModel } from "./model.js?v=20261124101623";
import { closeSheet } from "./sheet.js?v=20261124101623";
import { whyView } from "./views/why.js?v=20261124101623";
import { peopleView } from "./views/people.js?v=20261124101623";
import { engineView } from "./views/engine.js?v=20261124101623";
import { loopView } from "./views/loop.js?v=20261124101623";
import { dayView } from "./views/day.js?v=20261124101623";
import { useView } from "./views/use.js?v=20261124101623";

/* Boot: fetch the sealed bundle, open it with a kept key or the password,
   then route on the hash. Nothing readable exists until decryption works. */

const ROUTES = [
  ["why", "Why", whyView],
  ["you", "You built it", peopleView],
  ["engine", "The engine", engineView],
  ["loop", "The loop", loopView],
  ["day", "The day", dayView],
  ["use", "Use it", useView],
];

const $ = (id) => document.getElementById(id);
let model = null;

async function boot() {
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (local) {
    const preview = await fetch("data.json", { cache: "no-store" }).catch(() => null);
    if (preview?.ok) return start(await preview.json());
  }
  const res = await fetch("data.enc", { cache: "no-store" });
  if (!res.ok) return fail("This site could not load its data. Refresh to try again.");
  const sealed = await res.json();
  const key = await keptKey(sealed).catch(() => null);
  if (key) {
    const bundle = await openSealed(sealed, key).catch(() => null);
    if (bundle) return start(bundle);
    forgetKey();
  }
  showLock(sealed);
}

function showLock(sealed) {
  $("lock").hidden = false;
  const form = $("lock-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = $("lock-pw").value;
    if (!pw) return;
    $("lock-go").disabled = true;
    $("lock-go").textContent = "Opening";
    $("lock-error").textContent = "";
    try {
      const key = await deriveKey(pw, sealed);
      const bundle = await openSealed(sealed, key);
      await keepKey(key, sealed, $("lock-keep").checked);
      $("lock").hidden = true;
      start(bundle);
    } catch {
      $("lock-error").textContent = "That is not the password.";
      form.classList.remove("shake");
      void form.offsetWidth;
      form.classList.add("shake");
      $("lock-pw").select();
    } finally {
      $("lock-go").disabled = false;
      $("lock-go").textContent = "Open";
    }
  });
}

function fail(message) {
  $("lock").hidden = false;
  $("lock-error").textContent = message;
}

function start(bundle) {
  model = makeModel(bundle);
  $("app").hidden = false;
  $("nav").replaceChildren(...ROUTES.map(([id, label]) => h("a", { href: `#${id}`, "data-route": id }, label)));
  $("lock-out").addEventListener("click", () => {
    forgetKey();
    location.hash = "";
    location.reload();
  });
  window.addEventListener("hashchange", render);
  render();
}

function render() {
  const [route, arg] = location.hash.replace(/^#/, "").split("/");
  const found = ROUTES.find(([id]) => id === route) ?? ROUTES[0];
  closeSheet();
  document.querySelectorAll("[data-route]").forEach((a) => {
    if (a.dataset.route === found[0]) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  const view = h("div", { class: "view fade-in" });
  found[2](view, model, arg ? decodeURIComponent(arg) : null);
  view.append(
    h("footer", { class: "foot" },
      `Built from the 16th September session record on ${ordinalDate(model.meta.built)}. Every word, vote and link is the room's own.`),
  );
  $("view").replaceChildren(view);
  window.scrollTo({ top: 0 });
  document.title = `${found[1]} · Lava Labs`;
}

function ordinalDate(iso) {
  const d = new Date(iso);
  const n = d.getDate();
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix} ${d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
}

boot();
