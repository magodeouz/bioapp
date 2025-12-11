import { requireAuth, bindLogout } from "./auth.js";
import {
  upsertProfile,
  getProfileByUserId,
  listLinks,
  replaceLinks,
  uploadBackgroundImage,
} from "./data.js";

let userId = null;
let currentSettings = {};
let originalSettings = {};
let userProfile = null;
let linkDrafts = [];
let originalLinks = [];

function cloneLinks(arr = []) {
  return arr.map((l) => ({ ...l }));
}

async function ensureProfile(session) {
  try {
    const profile = await getProfileByUserId(session.user.id);
    return profile;
  } catch (_err) {
    const email = session.user.email || "";
    const meta = session.user.user_metadata || {};
    const username =
      meta.username ||
      (email.includes("@") ? email.split("@")[0] : `user-${session.user.id.slice(0, 6)}`);
    const display_name = meta.full_name || meta.fullName || username;
    return upsertProfile({
      id: session.user.id,
      username,
      display_name,
      email,
    });
  }
}

function loadSettings(profile) {
  userProfile = profile;
  currentSettings = {
    background_color: profile.background_color || "#f8fafc",
    background_image: profile.background_image || "",
    button_color: profile.button_color || "#4F46E5",
    text_color: profile.text_color || "#1a1a1a",
    font_family: profile.font_family || "Inter",
    button_shape: profile.button_shape || "pill",
    is_dark_mode: profile.is_dark_mode || false,
  };
  originalSettings = { ...currentSettings };
  applySettingsToForm();
  updatePreview();
}

function applySettingsToForm() {
  // Background color
  const bgRadios = document.querySelectorAll('input[name="background-color"]');
  bgRadios.forEach((radio) => {
    if (radio.value === currentSettings.background_color) {
      radio.checked = true;
      radio.closest("label").classList.add("ring-primary");
    }
  });

  // Button color
  const btnRadios = document.querySelectorAll('input[name="button-color"]');
  btnRadios.forEach((radio) => {
    if (radio.value === currentSettings.button_color) {
      radio.checked = true;
      radio.closest("label").classList.add("ring-primary");
    }
  });

  // Text color
  const textRadios = document.querySelectorAll('input[name="text-color"]');
  textRadios.forEach((radio) => {
    if (radio.value === currentSettings.text_color) {
      radio.checked = true;
      radio.closest("label").classList.add("ring-primary");
    }
  });

  // Font family
  const fontSelect = document.getElementById("font-family");
  if (fontSelect) {
    fontSelect.value = currentSettings.font_family;
  }

  // Button shape
  const shapeButtons = document.querySelectorAll('[data-shape]');
  shapeButtons.forEach((btn) => {
    btn.classList.remove("bg-white", "dark:bg-slate-700", "text-primary", "dark:text-white", "shadow-sm");
    btn.classList.add("text-slate-500", "dark:text-slate-400");
    if (btn.dataset.shape === currentSettings.button_shape) {
      btn.classList.remove("text-slate-500", "dark:text-slate-400");
      btn.classList.add("bg-white", "dark:bg-slate-700", "text-primary", "dark:text-white", "shadow-sm");
    }
  });

  // Mode
  const modeButtons = document.querySelectorAll('[data-mode]');
  modeButtons.forEach((btn) => {
    btn.classList.remove("bg-white", "dark:bg-slate-700", "text-primary", "dark:text-white", "shadow-sm");
    btn.classList.add("text-slate-500", "dark:text-slate-400");
    if (btn.dataset.mode === (currentSettings.is_dark_mode ? "dark" : "light")) {
      btn.classList.remove("text-slate-500", "dark:text-slate-400");
      btn.classList.add("bg-white", "dark:bg-slate-700", "text-primary", "dark:text-white", "shadow-sm");
    }
  });

  // Background image
  const bgImageInput = document.getElementById("background-image-url");
  const preview = document.getElementById("bg-image-preview");
  if (bgImageInput && currentSettings.background_image) {
    bgImageInput.value = currentSettings.background_image;
    if (preview) {
      preview.style.backgroundImage = `url("${currentSettings.background_image}")`;
      preview.classList.remove("hidden");
    }
  } else if (preview) {
    preview.classList.add("hidden");
    preview.style.backgroundImage = "";
  }
}

function renderPreviewLinks(containerId, links = [], themeSettings = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  
  // Filter only visible links (accent === "primary")
  const visibleLinks = links.filter((link) => link.accent === "primary");
  
  if (!visibleLinks.length) {
    container.innerHTML =
      '<p class="text-center text-gray-500 dark:text-gray-400">Henüz link eklenmedi.</p>';
    return;
  }
  
  const buttonColor = themeSettings.button_color || "#4F46E5";
  const buttonShape = themeSettings.button_shape || "pill";
  
  // Determine button shape classes
  let shapeClass = "rounded-lg";
  if (buttonShape === "pill") {
    shapeClass = "rounded-full";
  } else if (buttonShape === "circle") {
    shapeClass = "rounded-full w-14 h-14 p-0";
  }
  
  visibleLinks.forEach((link) => {
    const btn = document.createElement("a");
    btn.href = link.url;
    btn.target = "_blank";
    btn.rel = "noopener";
    
    const baseClasses =
      `flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden ${shapeClass} h-14 px-5 text-base font-bold leading-normal shadow-lg transition-transform hover:scale-[1.02]`;
    
    if (link.accent === "primary") {
      btn.className = `${baseClasses} text-white`;
      // Apply button color
      if (buttonColor.startsWith("#")) {
        btn.style.backgroundColor = buttonColor;
      } else if (buttonColor === "gradient") {
        btn.classList.add("vibrant-gradient-bg");
      } else {
        btn.style.backgroundColor = buttonColor;
      }
    } else {
      btn.className = `${baseClasses} bg-white dark:bg-slate-800 text-[#111618] dark:text-white`;
    }
    
    btn.innerHTML = `<span class="truncate">${link.title}</span>`;
    container.appendChild(btn);
  });
}

function renderPreviewSocial(containerId, socials = [], themeSettings = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  const textColor = themeSettings.text_color;
  socials.forEach((item) => {
    const anchor = document.createElement("a");
    anchor.href = item.url;
    anchor.target = "_blank";
    anchor.rel = "noopener";
    anchor.className =
      "flex flex-col items-center gap-2 text-center transition-transform hover:scale-105";
    if (textColor) anchor.style.color = textColor;
    anchor.innerHTML = `
      <div class="rounded-full bg-white dark:bg-slate-800 p-3.5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/50 dark:border-gray-700" style="${textColor ? `color:${textColor}` : ""}">
        <span class="material-symbols-outlined text-xl">${item.icon || "link"}</span>
      </div>
    `;
    container.appendChild(anchor);
  });
}

export async function updatePreview() {
  const wrapper = document.getElementById("preview-wrapper");
  const backgroundOverlay = document.getElementById("preview-background-overlay");
  const avatar = document.getElementById("preview-avatar");
  const username = document.getElementById("preview-username");
  const bio = document.getElementById("preview-bio");
  const linksContainer = document.getElementById("preview-links");
  const socialContainer = document.getElementById("preview-social-links");
  const highlightCard = document.getElementById("preview-highlight-card");

  if (!wrapper) return;

  // Load profile data (use cached if available)
  try {
    if (!userProfile) {
      userProfile = await getProfileByUserId(userId);
    }
    const profile = userProfile;
    const links = linkDrafts || [];

    // Update avatar
    if (avatar && profile.avatar_url) {
      avatar.style.backgroundImage = `url("${profile.avatar_url}")`;
    }

    // Update username
    if (username) {
      username.textContent = profile.display_name || profile.username || "username";
    }

    // Update bio
    if (bio) {
      bio.textContent = profile.bio || "";
    }

    // Update social links
    const themeSettings = {
      button_color: currentSettings.button_color,
      button_shape: currentSettings.button_shape,
      text_color: currentSettings.text_color,
    };

    renderPreviewSocial("preview-social-links", profile?.socials || [], themeSettings);

    // Update links (only visible ones)
    renderPreviewLinks("preview-links", links, themeSettings);

    // Update highlight card
    if (profile?.highlight_title && highlightCard) {
      highlightCard.classList.remove("hidden");
      const titleEl = document.getElementById("preview-highlight-title");
      const bodyEl = document.getElementById("preview-highlight-body");
      const linkEl = document.getElementById("preview-highlight-link");
      if (titleEl) titleEl.textContent = profile.highlight_title;
      if (bodyEl) bodyEl.textContent = profile.highlight_body || "";
      if (linkEl && profile.highlight_url) {
        linkEl.href = profile.highlight_url;
        // Apply button color to highlight link
        if (currentSettings.button_color) {
          if (currentSettings.button_color.startsWith("#")) {
            linkEl.style.backgroundColor = currentSettings.button_color;
          } else if (currentSettings.button_color === "gradient") {
            linkEl.classList.add("vibrant-gradient-bg");
          }
        }
        if (currentSettings.text_color) {
          linkEl.style.color = currentSettings.text_color;
        }
      }
      if (currentSettings.text_color) {
        if (titleEl) titleEl.style.color = currentSettings.text_color;
        if (bodyEl) bodyEl.style.color = currentSettings.text_color;
      }
    } else if (highlightCard) {
      highlightCard.classList.add("hidden");
    }

    // Apply background image or color
    if (currentSettings.background_image) {
      if (backgroundOverlay) {
        backgroundOverlay.style.backgroundImage = `url("${currentSettings.background_image}")`;
        backgroundOverlay.style.display = "block";
      }
    } else if (currentSettings.background_color === "gradient") {
      if (backgroundOverlay) {
        backgroundOverlay.style.background = "linear-gradient(to right, #f97794 0%, #623aa2 100%)";
        backgroundOverlay.style.backgroundSize = "cover";
        backgroundOverlay.style.display = "block";
      }
    } else if (currentSettings.background_color.startsWith("#")) {
      if (backgroundOverlay) {
        backgroundOverlay.style.backgroundColor = currentSettings.background_color;
        backgroundOverlay.style.backgroundImage = "none";
        backgroundOverlay.style.display = "block";
      }
    }

    // Apply text color
    if (username) username.style.color = currentSettings.text_color;
    if (bio) bio.style.color = currentSettings.text_color;

    // Apply font family
    if (wrapper) wrapper.style.fontFamily = currentSettings.font_family;

    // Apply dark mode
    if (currentSettings.is_dark_mode) {
      wrapper.classList.add("dark");
    } else {
      wrapper.classList.remove("dark");
    }
  } catch (err) {
    console.error("Error loading preview data:", err);
  }
}

function bindSettings() {
  console.log("bindSettings() called - setting up event listeners");
  // Background color
  document.querySelectorAll('input[name="background-color"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document.querySelectorAll('input[name="background-color"]').forEach((r) => {
        r.closest("label").classList.remove("ring-primary");
      });
      e.target.closest("label").classList.add("ring-primary");
      currentSettings.background_color = e.target.value;
      updatePreview();
    });
  });

  // Custom background color picker
  const addBgColorBtn = document.getElementById("add-bg-color");
  const customBgInput = document.getElementById("custom-bg-color");
  if (addBgColorBtn && customBgInput) {
    addBgColorBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isHidden = customBgInput.classList.contains("hidden");
      if (isHidden) {
        customBgInput.value = currentSettings.background_color || "#4F46E5";
        customBgInput.classList.remove("hidden");
        customBgInput.focus();
      } else {
        customBgInput.classList.add("hidden");
      }
    });
    customBgInput.addEventListener("input", (e) => {
      const val = e.target.value;
      currentSettings.background_color = val;
      document.querySelectorAll('input[name="background-color"]').forEach((r) => {
        r.checked = false;
        r.closest("label").classList.remove("ring-primary");
      });
      addBgColorBtn.classList.add("ring-primary");
      customBgInput.classList.add("hidden");
      updatePreview();
    });
  }

  // Button color
  document.querySelectorAll('input[name="button-color"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document.querySelectorAll('input[name="button-color"]').forEach((r) => {
        r.closest("label").classList.remove("ring-primary");
      });
      e.target.closest("label").classList.add("ring-primary");
      currentSettings.button_color = e.target.value;
      updatePreview();
    });
  });

  // Custom button color picker
  const addButtonColorBtn = document.getElementById("add-button-color");
  const customButtonInput = document.getElementById("custom-button-color");
  if (addButtonColorBtn && customButtonInput) {
    addButtonColorBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isHidden = customButtonInput.classList.contains("hidden");
      if (isHidden) {
        customButtonInput.value = currentSettings.button_color || "#4F46E5";
        customButtonInput.classList.remove("hidden");
        customButtonInput.focus();
      } else {
        customButtonInput.classList.add("hidden");
      }
    });
    customButtonInput.addEventListener("input", (e) => {
      const val = e.target.value;
      currentSettings.button_color = val;
      document.querySelectorAll('input[name="button-color"]').forEach((r) => {
        r.checked = false;
        r.closest("label").classList.remove("ring-primary");
      });
      addButtonColorBtn.classList.add("ring-primary");
      customButtonInput.classList.add("hidden");
      updatePreview();
    });
  }

  // Text color
  document.querySelectorAll('input[name="text-color"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      document.querySelectorAll('input[name="text-color"]').forEach((r) => {
        r.closest("label").classList.remove("ring-primary");
      });
      e.target.closest("label").classList.add("ring-primary");
      currentSettings.text_color = e.target.value;
      updatePreview();
    });
  });

  // Custom text color picker
  const addTextColorBtn = document.getElementById("add-text-color");
  const customTextInput = document.getElementById("custom-text-color");
  if (addTextColorBtn && customTextInput) {
    addTextColorBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isHidden = customTextInput.classList.contains("hidden");
      if (isHidden) {
        customTextInput.value = currentSettings.text_color || "#1a1a1a";
        customTextInput.classList.remove("hidden");
        customTextInput.focus();
      } else {
        customTextInput.classList.add("hidden");
      }
    });
    customTextInput.addEventListener("input", (e) => {
      const val = e.target.value;
      currentSettings.text_color = val;
      document.querySelectorAll('input[name="text-color"]').forEach((r) => {
        r.checked = false;
        r.closest("label").classList.remove("ring-primary");
      });
      addTextColorBtn.classList.add("ring-primary");
      customTextInput.classList.add("hidden");
      updatePreview();
    });
  }

  // Font family
  const fontSelect = document.getElementById("font-family");
  if (fontSelect) {
    fontSelect.addEventListener("change", (e) => {
      currentSettings.font_family = e.target.value;
      updatePreview();
    });
  }

  // Button shape
  document.querySelectorAll('[data-shape]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll('[data-shape]').forEach((b) => {
        b.classList.remove("bg-white", "dark:bg-slate-700", "text-primary", "dark:text-white", "shadow-sm");
        b.classList.add("text-slate-500", "dark:text-slate-400");
      });
      e.target.closest("button").classList.remove("text-slate-500", "dark:text-slate-400");
      e.target.closest("button").classList.add("bg-white", "dark:bg-slate-700", "text-primary", "dark:text-white", "shadow-sm");
      currentSettings.button_shape = e.target.closest("button").dataset.shape;
      updatePreview();
    });
  });

  // Mode
  document.querySelectorAll('[data-mode]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll('[data-mode]').forEach((b) => {
        b.classList.remove("bg-white", "dark:bg-slate-700", "text-primary", "dark:text-white", "shadow-sm");
        b.classList.add("text-slate-500", "dark:text-slate-400");
      });
      e.target.closest("button").classList.remove("text-slate-500", "dark:text-slate-400");
      e.target.closest("button").classList.add("bg-white", "dark:bg-slate-700", "text-primary", "dark:text-white", "shadow-sm");
      currentSettings.is_dark_mode = e.target.closest("button").dataset.mode === "dark";
      updatePreview();
    });
  });

  // File upload button
  const uploadBtn = document.getElementById("upload-bg-image-btn");
  const fileInput = document.getElementById("background-image-file");
  const successEl = document.getElementById("bg-image-success");
  
  console.log("Setting up upload button:", { uploadBtn, fileInput });
  
  if (uploadBtn && fileInput) {
    console.log("Upload button and file input found, adding listeners");
    
    // Handle click on button or its children
    uploadBtn.addEventListener("click", (e) => {
      console.log("Upload button clicked!");
      e.preventDefault();
      e.stopPropagation();
      if (fileInput) {
        console.log("Triggering file input click");
        fileInput.click();
      } else {
        console.error("File input not found when button clicked");
      }
    });
    
    // Also handle clicks on the span inside
    const uploadSpan = uploadBtn.querySelector("span");
    if (uploadSpan) {
      uploadSpan.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    fileInput.addEventListener("change", async (e) => {
      console.log("File input changed", e.target.files);
      const file = e.target.files?.[0];
      if (!file) {
        console.log("No file selected");
        return;
      }
      console.log("File selected:", file.name, file.size, file.type);

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Dosya boyutu 10MB'dan küçük olmalıdır.");
        fileInput.value = ""; // Reset input
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Lütfen bir resim dosyası seçin.");
        fileInput.value = ""; // Reset input
        return;
      }

      // Show loading state
      const originalHTML = uploadBtn.innerHTML;
      uploadBtn.setAttribute("disabled", "true");
      uploadBtn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">sync</span>';

      try {
        const url = await uploadBackgroundImage(userId, file);
        currentSettings.background_image = url;
        if (successEl) successEl.classList.remove("hidden");
        updatePreview();
      } catch (err) {
        console.error("Upload error:", err);
        alert("Görsel yüklenemedi: " + err.message);
      } finally {
        uploadBtn.removeAttribute("disabled");
        uploadBtn.innerHTML = originalHTML;
        fileInput.value = ""; // Reset input
      }
    });
  } else {
    console.warn("Upload button or file input not found:", { uploadBtn, fileInput });
  }

  // Show success if image exists initially
  if (successEl && currentSettings.background_image) {
    successEl.classList.remove("hidden");
  }
}

// -------------------
// Links: draft mode (only saved on Save Changes)
// -------------------
function renderLinkList() {
  const container = document.getElementById("links-list");
  if (!container) return;
  container.innerHTML = "";

  if (!linkDrafts.length) {
    container.innerHTML =
      '<p class="text-sm text-slate-500 dark:text-slate-400">Henüz link eklenmedi.</p>';
    updatePreview();
    return;
  }

  linkDrafts.forEach((link) => {
    const item = document.createElement("div");
    item.className =
      "flex items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-lg shadow-sm border border-slate-200/80 dark:border-slate-800/80";
    item.innerHTML = `
      <div class="text-slate-400 dark:text-slate-500 cursor-grab">
        <span class="material-symbols-outlined text-2xl">drag_indicator</span>
      </div>
      <div class="flex flex-col justify-center flex-1 min-w-0">
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
  updatePreview();
}

function bindLinkActions() {
  const form = document.getElementById("link-form");

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const deleteId = target.closest("[data-delete]")?.getAttribute("data-delete");
    const editId = target.closest("[data-edit]")?.getAttribute("data-edit");
    const toggleId = target.closest("[data-toggle]")?.getAttribute("data-toggle");

    if (deleteId) {
      linkDrafts = linkDrafts.filter((l) => l.id !== deleteId);
      renderLinkList();
    }
    if (editId) {
      const link = linkDrafts.find((l) => l.id === editId);
      if (link) {
        document.getElementById("link-title").value = link.title;
        document.getElementById("link-url").value = link.url;
        document.getElementById("link-accent").value = link.accent || "primary";
        document.getElementById("link-submit").textContent = "Güncelle";
        form.dataset.editing = editId;
      }
    }
    if (toggleId) {
      const link = linkDrafts.find((l) => l.id === toggleId);
      if (link) {
        link.accent = link.accent === "primary" ? "secondary" : "primary";
        renderLinkList();
      }
    }
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("link-title")?.value.trim();
    const url = document.getElementById("link-url")?.value.trim();
    const accent = document.getElementById("link-accent")?.value || "primary";
    if (!title || !url) return alert("Başlık ve URL gerekli");

    const editingId = form.dataset.editing;
    if (editingId) {
      const idx = linkDrafts.findIndex((l) => l.id === editingId);
      if (idx > -1) {
        linkDrafts[idx] = { ...linkDrafts[idx], title, url, accent };
      }
      delete form.dataset.editing;
      document.getElementById("link-submit").textContent = "Link Ekle";
    } else {
      const newLink = {
        id: `draft-${Date.now()}`,
        title,
        url,
        accent,
      };
      linkDrafts.push(newLink);
    }
    form.reset();
    renderLinkList();
  });
}

async function persistLinkDrafts() {
  await replaceLinks(
    userId,
    linkDrafts.map((l, idx) => ({ ...l, order: idx }))
  );
  originalLinks = cloneLinks(linkDrafts);
}

function hasLinkChanges() {
  const a = JSON.stringify(
    linkDrafts.map((l, idx) => ({ title: l.title, url: l.url, accent: l.accent || "primary", order: idx }))
  );
  const b = JSON.stringify(
    originalLinks.map((l, idx) => ({ title: l.title, url: l.url, accent: l.accent || "primary", order: idx }))
  );
  return a !== b;
}

function bindSave() {
  const saveBtn = document.getElementById("save-btn");
  const discardBtn = document.getElementById("discard-btn");

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      saveBtn.setAttribute("disabled", "true");
      try {
        // Get username from profile
        let username = userProfile?.username;
        if (!username) {
          // Try to get from current profile
          const profile = await getProfileByUserId(userId);
          username = profile.username;
        }
        
        if (!username) {
          throw new Error("Username bulunamadı. Lütfen profil ayarlarınızı kontrol edin.");
        }
        
        await upsertProfile({
          id: userId,
          username,
          ...currentSettings,
        });

        if (hasLinkChanges()) {
          await persistLinkDrafts();
        }

        // Update userProfile with new settings
        userProfile = { ...userProfile, ...currentSettings, username };
        originalSettings = { ...currentSettings };
        alert("Tema ve link ayarları kaydedildi!");
      } catch (err) {
        alert("Ayarlar kaydedilemedi: " + err.message);
      } finally {
        saveBtn.removeAttribute("disabled");
      }
    });
  }

  if (discardBtn) {
    discardBtn.addEventListener("click", () => {
      currentSettings = { ...originalSettings };
      applySettingsToForm();
      updatePreview();
    });
  }
}

async function init() {
  console.log("init() called");
  const session = await requireAuth("/auth/login.html");
  if (!session) {
    console.log("No session, returning");
    return;
  }
  console.log("Session found, userId:", session.user.id);
  bindLogout();
  userId = session.user.id;
  await ensureProfile(session);
  
  const profile = await getProfileByUserId(userId);
  console.log("Profile loaded:", profile);
  loadSettings(profile);
  // Load links into drafts
  const links = await listLinks(userId);
  linkDrafts = cloneLinks(links);
  originalLinks = cloneLinks(links);
  renderLinkList();
  console.log("Calling bindSettings()");
  bindSettings();
  console.log("Calling bindLinkActions()");
  bindLinkActions();
  console.log("Calling bindSave()");
  bindSave();
  console.log("Init complete");
}

document.addEventListener("DOMContentLoaded", init);
