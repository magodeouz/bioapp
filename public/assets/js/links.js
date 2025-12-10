import { requireAuth, bindLogout } from "./auth.js";
import { listLinks, createLink, updateLink, deleteLink } from "./data.js";
import { updatePreview } from "./themes.js";

let userId = null;
let links = [];

const linkForm = () => document.getElementById("link-form");

function setPreview() {
  // If we're on themes/manage.html, use the themes.js updatePreview
  const previewLinks = document.getElementById("preview-links");
  if (previewLinks) {
    // We're on themes/manage.html, update the themes preview
    updatePreview().catch(console.error);
    return;
  }
  
  // Otherwise, use the old preview for links/index.html
  const preview = document.getElementById("link-preview");
  if (!preview) return;
  preview.innerHTML = "";
  const visible = links.filter((l) => l.accent === "primary");
  if (!visible.length) {
    preview.innerHTML =
      '<p class="text-sm text-slate-500 dark:text-slate-400 text-center mt-6">Henüz link yok.</p>';
    return;
  }
  visible.forEach((link) => {
    const a = document.createElement("a");
    const isPrimary = link.accent === "primary";
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = isPrimary
      ? "block w-full text-center bg-blue-600 text-white p-3 rounded-full font-semibold text-sm hover:bg-blue-700 transition-colors"
      : "block w-full text-center bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-3 rounded-full font-semibold text-sm";
    a.textContent = link.title;
    preview.appendChild(a);
  });
}

function renderList() {
  const container = document.getElementById("links-list");
  if (!container) return;
  container.innerHTML = "";
  if (!links.length) {
    container.innerHTML =
      '<p class="text-sm text-slate-500 dark:text-slate-400">Henüz link eklenmedi.</p>';
    setPreview();
    return;
  }
  links.forEach((link) => {
    const item = document.createElement("div");
    item.className =
      "flex items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-slate-200/80 dark:border-slate-800/80";
    item.innerHTML = `
      <div class="text-slate-400 dark:text-slate-500 cursor-grab">
        <span class="material-symbols-outlined text-2xl">drag_indicator</span>
      </div>
      <div class="flex flex-col justify-center flex-1">
        <p class="text-slate-800 dark:text-slate-100 text-base font-medium leading-normal line-clamp-1">${link.title}</p>
        <p class="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal line-clamp-2">${link.url}</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" data-edit="${link.id}">
          <span class="material-symbols-outlined text-xl">edit</span>
        </button>
        <button class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" data-delete="${link.id}">
          <span class="material-symbols-outlined text-xl">delete</span>
        </button>
        <label class="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-slate-200 dark:bg-slate-700 p-0.5 has-[:checked]:bg-blue-600 transition-colors">
          <input class="invisible absolute" type="checkbox" ${link.accent === "primary" ? "checked" : ""} data-toggle="${link.id}"/>
          <div class="h-full w-[27px] rounded-full bg-white transition-transform ease-in-out duration-200 ${
            link.accent === "primary" ? "translate-x-[20px]" : ""
          }" style="box-shadow: rgba(0, 0, 0, 0.1) 0px 2px 6px, rgba(0, 0, 0, 0.04) 0px 2px 1px;"></div>
        </label>
      </div>
    `;
    container.appendChild(item);
  });
  setPreview();
}

async function loadLinks() {
  links = await listLinks(userId);
  renderList();
}

async function handleCreate(e) {
  e.preventDefault();
  const title = document.getElementById("link-title")?.value.trim();
  const url = document.getElementById("link-url")?.value.trim();
  const accent = document.getElementById("link-accent")?.value || "primary";
  if (!title || !url) return alert("Başlık ve URL gerekli");
  const payload = { title, url, accent, user_id: userId, order: links.length };
  const btn = document.getElementById("link-submit");
  btn?.setAttribute("disabled", "true");
  try {
    await createLink(payload);
    linkForm()?.reset();
    await loadLinks();
  } catch (err) {
    console.error(err);
    alert("Link eklenemedi: " + err.message);
  } finally {
    btn?.removeAttribute("disabled");
  }
}

async function handleDelete(id) {
  if (!confirm("Bu link silinsin mi?")) return;
  try {
    await deleteLink(id);
    await loadLinks();
  } catch (err) {
    alert("Silme başarısız: " + err.message);
  }
}

async function handleToggle(id, checked) {
  try {
    await updateLink(id, { accent: checked ? "primary" : "secondary" });
    await loadLinks();
  } catch (err) {
    alert("Güncellenemedi: " + err.message);
  }
}

function bindActions() {
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const deleteId = target.closest("[data-delete]")?.getAttribute("data-delete");
    const editId = target.closest("[data-edit]")?.getAttribute("data-edit");
    const toggleId = target.closest("[data-toggle]")?.getAttribute("data-toggle");

    if (deleteId) handleDelete(deleteId);
    if (editId) {
      const link = links.find((l) => l.id === editId);
      if (link) {
        document.getElementById("link-title").value = link.title;
        document.getElementById("link-url").value = link.url;
        document.getElementById("link-accent").value = link.accent || "primary";
        document.getElementById("link-submit").textContent = "Güncelle";
        linkForm().dataset.editing = editId;
      }
    }
    if (toggleId) {
      const input = target.closest("label")?.querySelector("input");
      if (input) handleToggle(toggleId, input.checked);
    }
  });

  linkForm()?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editingId = linkForm().dataset.editing;
    if (editingId) {
      const title = document.getElementById("link-title").value.trim();
      const url = document.getElementById("link-url").value.trim();
      const accent = document.getElementById("link-accent").value;
      try {
        await updateLink(editingId, { title, url, accent });
        linkForm().reset();
        delete linkForm().dataset.editing;
        document.getElementById("link-submit").textContent = "Link Ekle";
        await loadLinks();
      } catch (err) {
        alert("Güncellenemedi: " + err.message);
      }
    } else {
      handleCreate(e);
    }
  });
}

async function init() {
  const session = await requireAuth("/auth/login.html");
  if (!session) return;
  bindLogout();
  userId = session.user.id;
  await loadLinks();
}

document.addEventListener("DOMContentLoaded", () => {
  bindActions();
  init();
});

