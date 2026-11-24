/* Browser half of build/seal.py. PBKDF2-SHA256 turns the password into an
   AES-256-GCM key; GCM refuses to decrypt with the wrong key, which is how a
   wrong password is detected. A kept key is stored with the salt it belongs
   to, so a rebuild with a new salt simply asks for the password again. */

const KEEP = "lava-engine-key";
const enc = new TextEncoder();

const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

export async function deriveKey(password, sealed) {
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: fromB64(sealed.salt), iterations: sealed.iter },
    base,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"],
  );
}

export async function openSealed(sealed, key) {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(sealed.iv) },
    key,
    fromB64(sealed.ct),
  );
  return JSON.parse(new TextDecoder().decode(plain));
}

export async function keepKey(key, sealed, persist) {
  const raw = toB64(await crypto.subtle.exportKey("raw", key));
  const value = JSON.stringify({ salt: sealed.salt, raw });
  (persist ? localStorage : sessionStorage).setItem(KEEP, value);
}

export async function keptKey(sealed) {
  const value = sessionStorage.getItem(KEEP) ?? localStorage.getItem(KEEP);
  if (!value) return null;
  const { salt, raw } = JSON.parse(value);
  if (salt !== sealed.salt) return null;
  return crypto.subtle.importKey("raw", fromB64(raw), "AES-GCM", true, ["decrypt"]);
}

export function forgetKey() {
  sessionStorage.removeItem(KEEP);
  localStorage.removeItem(KEEP);
}
