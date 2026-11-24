import { deriveKey, forgetKey, keepKey, keptKey, openSealed } from "./crypto.js?v=20261124130956";
import { h } from "./dom.js?v=20261124130956";
import { engine, helps, hero, loop } from "./sections/engine.js?v=20261124130956";
import { compare, grows, targets, today } from "./sections/targets.js?v=20261124130956";

/* Boot: fetch the sealed page, open it with a kept key or the password,
   then draw one simple page. Nothing readable exists until decryption works. */

const $ = (id) => document.getElementById(id);

async function boot() {
  const local = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (local) {
    const preview = await fetch("data.json", { cache: "no-store" }).catch(() => null);
    if (preview?.ok) return start(await preview.json());
  }
  const res = await fetch("data.enc", { cache: "no-store" });
  if (!res.ok) return fail("This site could not load. Refresh to try again.");
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
  const p = bundle.page;
  $("app").hidden = false;
  $("lock-out").addEventListener("click", () => {
    forgetKey();
    location.reload();
  });
  $("view").replaceChildren(h("div", { class: "page fade-in" },
    hero(p), engine(p), loop(p), helps(p), today(p), targets(p), compare(p), grows(p),
    h("footer", { class: "foot" }, `Lava Labs. Updated ${bundle.meta.updated}.`)));
  document.title = "The engine · Lava Labs";
}

boot();
