import { requireAuth, bindLogout } from "./auth.js";
import { getProfileByUserId, upsertProfile } from "./data.js";

function val(id) {
  return document.getElementById(id)?.value?.trim();
}

function setVal(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

async function loadProfile(userId) {
  const data = await getProfileByUserId(userId);
  setVal("settings-display-name", data?.display_name);
  setVal("settings-username", data?.username);
  setVal("settings-bio", data?.bio);
  setVal("settings-email", data?.email);
  setVal("settings-avatar", data?.avatar_url);
  setVal("settings-highlight-title", data?.highlight_title);
  setVal("settings-highlight-body", data?.highlight_body);
  setVal("settings-highlight-url", data?.highlight_url);
}

async function init() {
  const session = await requireAuth("/auth/login.html");
  if (!session) return;
  bindLogout();
  const userId = session.user.id;
  try {
    await loadProfile(userId);
  } catch (err) {
    console.warn("Profile could not be loaded", err);
  }

  const form = document.getElementById("settings-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      id: userId,
      display_name: val("settings-display-name"),
      username: val("settings-username"),
      bio: val("settings-bio"),
      email: val("settings-email"),
      avatar_url: val("settings-avatar"),
      highlight_title: val("settings-highlight-title"),
      highlight_body: val("settings-highlight-body"),
      highlight_url: val("settings-highlight-url"),
    };
    const btn = document.getElementById("settings-save");
    btn?.setAttribute("disabled", "true");
    try {
      await upsertProfile(payload);
      alert("Profil güncellendi");
    } catch (err) {
      alert("Kaydedilemedi: " + err.message);
    } finally {
      btn?.removeAttribute("disabled");
    }
  });
}

document.addEventListener("DOMContentLoaded", init);

