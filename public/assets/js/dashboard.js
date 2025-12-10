import { requireAuth, bindLogout } from "./auth.js";
import { getProfileByUserId, listLinks } from "./data.js";

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function loadDashboard() {
  const session = await requireAuth("/auth/login.html");
  if (!session) return;

  bindLogout();

  const userId = session.user.id;
  let profile = null;
  try {
    profile = await getProfileByUserId(userId);

    // Onboarding guard: önce tema seç, ardından link ekleme.
    if (!profile?.active_theme_id) {
      window.location.href = "/themes/select.html";
      return;
    }

    const existingLinks = await listLinks(userId).catch(() => []);
    if (!existingLinks.length) {
      window.location.href = "/onboarding/platforms.html";
      return;
    }

    links = existingLinks;
  } catch (err) {
    console.warn("Profile could not be loaded", err);
  }

  setText("dash-name", profile?.display_name || profile?.username || "BioFlow");
  setText("dash-username", profile?.username ? `bioflow.me/${profile.username}` : "");
  setText("dash-link-count", links.length.toString());
  setText("dash-top-link", links[0]?.title || "Henüz link yok");
  setText("dash-views", profile?.profile_views?.toString() || "0");
  setText("dash-clicks", profile?.total_clicks?.toString() || "0");

  const recent = document.getElementById("dash-recent");
  if (recent) {
    recent.innerHTML = "";
    if (!links.length) {
      recent.innerHTML =
        '<p class="text-sm text-slate-500 dark:text-slate-400">Henüz aktivite yok.</p>';
      return;
    }
    links.slice(0, 3).forEach((link) => {
      const item = document.createElement("div");
      item.className =
        "flex items-start gap-4 p-4 rounded-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-soft";
      item.innerHTML = `
        <div class="flex items-center justify-center size-10 rounded-full bg-violet-100 dark:bg-violet-500/20">
          <span class="material-symbols-outlined text-violet-600 dark:text-violet-400">add_link</span>
        </div>
        <div class="flex flex-col">
          <p class="text-sm font-medium text-slate-800 dark:text-slate-200">${link.title}</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">${link.url}</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Linkiniz yayında</p>
        </div>
      `;
      recent.appendChild(item);
    });
  }
}

document.addEventListener("DOMContentLoaded", loadDashboard);

