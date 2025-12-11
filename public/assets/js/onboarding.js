import { requireAuth } from "./auth.js";
import { upsertProfile, createLink, uploadAvatar, getProfileByUserId, listLinks } from "./data.js";

function page(path) {
  return window.location.pathname.split("/").pop() || path;
}

async function handleProfileDetails() {
  const form = document.getElementById("profile-form");
  if (!form) return;
  const session = await requireAuth("/auth/login.html");
  if (!session) return;
  const userId = session.user.id;

  // Ensure profile exists with username
  let existingProfile = null;
  try {
    existingProfile = await getProfileByUserId(userId);
  } catch (err) {
    // Profile doesn't exist, create it
    const email = session.user.email || "";
    const meta = session.user.user_metadata || {};
    const username = meta.username || (email.includes("@") ? email.split("@")[0] : `user-${userId.slice(0, 6)}`);
    const display_name = meta.full_name || meta.fullName || username;
    try {
      const created = await upsertProfile({
        id: userId,
        username,
        display_name,
        email,
      });
      existingProfile = created;
    } catch (createErr) {
      console.error("Profile oluşturulamadı:", createErr);
    }
  }

  // Avatar upload functionality
  const avatarButton = document.querySelector("button.relative.w-32.h-32");
  const avatarUrlInput = document.getElementById("avatar-url");
  let avatarPreview = null;

  // Create hidden file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";

  // Create preview image element
  const previewImg = document.createElement("img");
  previewImg.className = "w-full h-full rounded-full object-cover";
  previewImg.style.display = "none";

  avatarButton?.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Dosya boyutu 5MB'dan küçük olmalıdır.");
      return;
    }

    // Show loading state
    const buttonContent = avatarButton.querySelector("div");
    if (buttonContent) {
      buttonContent.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>';
    }

    try {
      const url = await uploadAvatar(userId, file);
      avatarUrlInput.value = url;

      // Show preview
      previewImg.src = url;
      previewImg.style.display = "block";
      if (buttonContent) {
        buttonContent.innerHTML = "";
        buttonContent.appendChild(previewImg);
      }
    } catch (err) {
      alert("Fotoğraf yüklenemedi: " + err.message);
      if (buttonContent) {
        buttonContent.innerHTML = `
          <svg class="w-16 h-16 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
          </svg>
        `;
      }
    }
  });

  // Add file input to DOM
  document.body.appendChild(fileInput);

  // Load existing avatar if available
  try {
    const profile = await getProfileByUserId(userId);
    if (profile?.avatar_url) {
      avatarUrlInput.value = profile.avatar_url;
      previewImg.src = profile.avatar_url;
      previewImg.style.display = "block";
      const buttonContent = avatarButton?.querySelector("div");
      if (buttonContent) {
        buttonContent.innerHTML = "";
        buttonContent.appendChild(previewImg);
      }
    }
    // Load existing bio
    const bioInput = document.getElementById("bio-input");
    if (bioInput && profile?.bio) {
      bioInput.value = profile.bio;
      // Update character count
      const charCount = document.querySelector(".absolute.bottom-2.right-3");
      if (charCount) {
        charCount.textContent = `${profile.bio.length}/160`;
      }
    }
  } catch (err) {
    // Profile might not exist yet, that's okay
  }

  // Bio character counter
  const bioInput = document.getElementById("bio-input");
  const charCount = document.querySelector(".absolute.bottom-2.right-3");
  if (bioInput && charCount) {
    bioInput.addEventListener("input", () => {
      charCount.textContent = `${bioInput.value.length}/160`;
    });
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const display_name = document.getElementById("display-name")?.value?.trim();
    const bio = document.getElementById("bio-input")?.value?.trim();
    const avatar_url = document.getElementById("avatar-url")?.value?.trim() || null;
    const btn = document.getElementById("profile-continue");
    btn?.setAttribute("disabled", "true");
    try {
      // Get username from existing profile or user metadata
      let username = existingProfile?.username;
      if (!username) {
        username = session.user.user_metadata?.username;
      }
      if (!username) {
        throw new Error("Username bulunamadı. Lütfen önce kayıt olun.");
      }

      const themeFields = existingProfile
        ? {
            background_color: existingProfile.background_color,
            background_image: existingProfile.background_image,
            button_color: existingProfile.button_color,
            text_color: existingProfile.text_color,
            font_family: existingProfile.font_family,
            button_shape: existingProfile.button_shape,
            is_dark_mode: existingProfile.is_dark_mode,
          }
        : {};

      await upsertProfile({
        id: userId,
        username,
        display_name,
        bio,
        avatar_url,
        ...themeFields,
      });
      window.location.href = "/onboarding/complete.html";
    } catch (err) {
      alert("Profil güncellenemedi: " + err.message);
    } finally {
      btn?.removeAttribute("disabled");
    }
  };

  form.addEventListener("submit", handleSubmit);
  
  // Continue button click handler (button is outside form)
  const continueBtn = document.getElementById("profile-continue");
  continueBtn?.addEventListener("click", handleSubmit);
}

async function bindPlatformSelection() {
  const session = await requireAuth("/auth/login.html");
  if (!session) return;
  const cards = document.querySelectorAll(".platform-card");
  if (!cards.length) return;
  const selected = new Set();
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const name = card.querySelector("span")?.textContent?.trim();
      if (!name) return;
      if (card.classList.contains("selected")) {
        card.classList.remove("selected");
        selected.delete(name);
      } else {
        card.classList.add("selected");
        selected.add(name);
      }
    });
  });
  const btn = document.getElementById("platform-continue");
  btn?.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.setItem("bf_platforms", JSON.stringify(Array.from(selected)));
    window.location.href = "/links/new.html";
  });
}

function getPlaceholderUrl(platform) {
  const placeholders = {
    "Instagram": "https://instagram.com/yourusername",
    "WhatsApp": "https://wa.me/905551234567",
    "TikTok": "https://tiktok.com/@yourusername",
    "YouTube": "https://youtube.com/@yourusername",
    "Personal Website": "https://yourwebsite.com",
    "Spotify": "https://open.spotify.com/artist/yourid",
    "Threads": "https://threads.net/@yourusername",
    "Facebook": "https://facebook.com/yourusername",
    "X": "https://x.com/yourusername",
    "SoundCloud": "https://soundcloud.com/yourusername",
    "Snapchat": "https://snapchat.com/add/yourusername",
    "Pinterest": "https://pinterest.com/yourusername",
  };
  return placeholders[platform] || "https://example.com/yourlink";
}

async function handleLinkOnboarding() {
  const list = document.getElementById("links-dynamic");
  if (!list) return;
  const session = await requireAuth("/auth/login.html");
  if (!session) return;
  let userId = session.user.id;
  const saved = JSON.parse(localStorage.getItem("bf_platforms") || "[]");
  if (!saved.length && list.children.length === 0) {
    list.innerHTML =
      '<div class="text-center py-8"><p class="text-sm text-gray-500 dark:text-gray-400">Platform seçimi yapılmadı. Herhangi bir link ekleyebilirsiniz.</p></div>';
  } else {
    list.innerHTML = "";
    saved.forEach((platform) => {
      const row = document.createElement("div");
      row.className = "flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors";
      row.innerHTML = `
        <input class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="Başlık" value="${platform}" />
        <input type="url" class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="${getPlaceholderUrl(platform)}" />
      `;
      list.appendChild(row);
    });
  }
  const addBtn = document.getElementById("add-link-row");
  addBtn?.addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "flex flex-col sm:flex-row gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors";
    row.innerHTML = `
      <input class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="Başlık" />
      <input type="url" class="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500" placeholder="https://example.com/yourlink" />
    `;
    list.appendChild(row);
  });

  const saveBtn = document.getElementById("links-save");
  saveBtn?.addEventListener("click", async () => {
    const freshSession = await requireAuth("/auth/login.html");
    if (!freshSession) return;
    userId = freshSession.user.id;

    // Ensure profile exists before inserting links
    try {
      await getProfileByUserId(userId);
    } catch (_err) {
      const email = freshSession.user.email || "";
      const meta = freshSession.user.user_metadata || {};
      const username =
        meta.username ||
        (email.includes("@") ? email.split("@")[0] : `user-${userId.slice(0, 6)}`);
      const display_name = meta.full_name || meta.fullName || username;
      await upsertProfile({ id: userId, username, display_name, email });
    }

    const inputs = list.querySelectorAll("input");
    const pairs = [];
    for (let i = 0; i < inputs.length; i += 2) {
      const title = inputs[i]?.value?.trim();
      const url = inputs[i + 1]?.value?.trim() || inputs[i]?.value?.trim();
      if (title && url) pairs.push({ title, url });
    }
    if (!pairs.length) {
      alert("En az bir link ekleyin.");
      return;
    }
    saveBtn.setAttribute("disabled", "true");
    try {
      for (let i = 0; i < pairs.length; i++) {
        await createLink({ ...pairs[i], accent: i === 0 ? "primary" : "secondary", order: i, user_id: userId });
      }
      window.location.href = "/onboarding/profile-details.html";
    } catch (err) {
      alert("Linkler kaydedilemedi: " + err.message);
    } finally {
      saveBtn.removeAttribute("disabled");
    }
  });
}

async function handleOnboardingComplete() {
  const session = await requireAuth("/auth/login.html");
  if (!session) return;
  const userId = session.user.id;

  try {
    // Get profile data
    const profile = await getProfileByUserId(userId);
    const links = await listLinks(userId);
    const selectedPlatforms = JSON.parse(localStorage.getItem("bf_platforms") || "[]");

    // Update profile preview
    const avatarImg = document.getElementById("profile-avatar");
    const profileName = document.getElementById("profile-name");
    const profileUsername = document.getElementById("profile-username");
    const profileBio = document.getElementById("profile-bio");
    const viewProfileLink = document.getElementById("view-profile-link");

    if (avatarImg && profile?.avatar_url) {
      avatarImg.src = profile.avatar_url;
    } else if (avatarImg) {
      avatarImg.style.display = "none";
    }

    if (profileName) {
      profileName.textContent = profile?.display_name || "Kullanıcı";
    }

    if (profileUsername) {
      profileUsername.textContent = `@${profile?.username || "kullanici"}`;
    }

    if (profileBio) {
      profileBio.textContent = profile?.bio || "Bio henüz eklenmemiş.";
    }

    if (viewProfileLink && profile?.username) {
      viewProfileLink.href = `/${profile.username}`;
    }

    // Display selected platforms
    const platformsList = document.getElementById("platforms-list");
    if (platformsList) {
      if (selectedPlatforms.length > 0) {
        selectedPlatforms.forEach((platform) => {
          const badge = document.createElement("span");
          badge.className = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800";
          badge.textContent = platform;
          platformsList.appendChild(badge);
        });
      } else {
        platformsList.innerHTML = '<span class="text-gray-500 dark:text-gray-400 text-sm">Platform seçilmedi</span>';
      }
    }

    // Display added links
    const linksList = document.getElementById("links-list");
    if (linksList) {
      if (links.length > 0) {
        links.forEach((link) => {
          const linkItem = document.createElement("div");
          linkItem.className = "flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700";
          linkItem.innerHTML = `
            <span class="material-symbols-outlined text-purple-600 dark:text-purple-400">link</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${link.title || "Link"}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${link.url}</p>
            </div>
          `;
          linksList.appendChild(linkItem);
        });
      } else {
        linksList.innerHTML = '<span class="text-gray-500 dark:text-gray-400 text-sm">Link eklenmedi</span>';
      }
    }

    // Clear onboarding data from localStorage
    localStorage.removeItem("bf_platforms");
  } catch (err) {
    console.error("Error loading onboarding complete data:", err);
    alert("Bilgiler yüklenirken bir hata oluştu: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const current = page();
  if (current.includes("profile-details")) handleProfileDetails();
  if (current.includes("platforms")) bindPlatformSelection();
  if (current.includes("new.html")) handleLinkOnboarding();
  if (current.includes("complete.html")) handleOnboardingComplete();
});

