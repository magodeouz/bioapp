import { supabase } from "./supabaseClient.js";
import { getProfileByUsername } from "./data.js";

function getUsernameFromPath() {
  const path = window.location.pathname.replace(/^\//, "");
  if (!path || path === "profile" || path.startsWith("profile/")) {
    const params = new URLSearchParams(window.location.search);
    return params.get("username") || params.get("u");
  }
  return path.split("/")[0];
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function setAvatar(id, url) {
  const el = document.getElementById(id);
  if (el && url) {
    el.style.backgroundImage = `url("${url}")`;
  }
}

function renderLinks(containerId, links = [], themeSettings = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  if (!links.length) {
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
  
  links.forEach((link) => {
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
      btn.className = `${baseClasses} bg-white dark:bg-surface-dark text-[#111618] dark:text-white`;
    }
    
    btn.innerHTML = `<span class="truncate">${link.title}</span>`;
    container.appendChild(btn);
  });
}

function renderSocial(containerId, socials = [], themeSettings = {}) {
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
    if (textColor) {
      anchor.style.color = textColor;
    }
    anchor.innerHTML = `
      <div class="rounded-full bg-white/95 dark:bg-surface-dark p-3.5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-gray-200/50 dark:border-gray-700 ${textColor ? "" : ""}" style="${textColor ? `color:${textColor}` : ""}">
        <span class="material-symbols-outlined text-xl">${item.icon || "link"}</span>
      </div>
    `;
    container.appendChild(anchor);
  });
}

function injectAds() {
  if (!window.ENV?.GOOGLE_ADSENSE_CLIENT || !window.ENV?.GOOGLE_ADSENSE_SLOT) {
    console.warn("Google AdSense config missing");
    return;
  }
  const ins = document.querySelector("ins.adsbygoogle");
  if (ins) {
    ins.setAttribute("data-ad-client", window.ENV.GOOGLE_ADSENSE_CLIENT);
    ins.setAttribute("data-ad-slot", window.ENV.GOOGLE_ADSENSE_SLOT);
  }
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
  script.setAttribute("data-ad-client", window.ENV.GOOGLE_ADSENSE_CLIENT);
  document.head.appendChild(script);
  setTimeout(() => {
    try {
      // eslint-disable-next-line no-undef
      (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("Adsense load failed", err);
    }
  }, 500);
}

function applyThemeSettings(themeSettings) {
  if (!themeSettings) return;
  
  const body = document.body;
  const backgroundOverlay = document.getElementById("background-overlay");
  
  // Apply background image or color
  if (themeSettings.background_image) {
    if (backgroundOverlay) {
      backgroundOverlay.style.backgroundImage = `url("${themeSettings.background_image}")`;
      backgroundOverlay.style.display = "block";
    }
  } else if (themeSettings.background_color) {
    if (themeSettings.background_color === "gradient") {
      if (backgroundOverlay) {
        backgroundOverlay.style.background = "linear-gradient(to right, #f97794 0%, #623aa2 100%)";
        backgroundOverlay.style.backgroundSize = "cover";
        backgroundOverlay.style.display = "block";
      }
    } else if (themeSettings.background_color.startsWith("#")) {
      if (backgroundOverlay) {
        backgroundOverlay.style.backgroundColor = themeSettings.background_color;
        backgroundOverlay.style.backgroundImage = "none";
        backgroundOverlay.style.display = "block";
      }
      body.style.backgroundColor = themeSettings.background_color;
    }
  }
  
  // Apply text color
  if (themeSettings.text_color) {
    const nameEl = document.getElementById("profile-name");
    const bioEl = document.getElementById("profile-bio");
    if (nameEl) nameEl.style.color = themeSettings.text_color;
    if (bioEl) bioEl.style.color = themeSettings.text_color;
  }
  
  // Apply font family
  if (themeSettings.font_family) {
    body.style.fontFamily = themeSettings.font_family;
    // Load font if not already loaded
    if (themeSettings.font_family !== "Inter") {
      const link = document.createElement("link");
      link.href = `https://fonts.googleapis.com/css2?family=${themeSettings.font_family.replace(/\s+/g, "+")}:wght@400;500;600;700;800;900&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }
  
  // Apply dark mode
  if (themeSettings.is_dark_mode) {
    body.classList.add("dark");
    document.documentElement.classList.add("dark");
  } else {
    body.classList.remove("dark");
    document.documentElement.classList.remove("dark");
  }
}

export async function renderPublicProfile() {
  const username = getUsernameFromPath();
  if (!username) {
    document.getElementById("profile-error").classList.remove("hidden");
    return;
  }
  try {
    const profile = await getProfileByUsername(username);
    
    // Extract theme settings from profile
    const themeSettings = {
      background_color: profile?.background_color,
      background_image: profile?.background_image,
      button_color: profile?.button_color,
      text_color: profile?.text_color,
      font_family: profile?.font_family,
      button_shape: profile?.button_shape,
      is_dark_mode: profile?.is_dark_mode,
    };
    
    // Apply theme settings
    applyThemeSettings(themeSettings);
    
    setAvatar("profile-avatar", profile?.avatar_url);
    setText("profile-name", profile?.display_name || profile?.username || username);
    setText("profile-bio", profile?.bio || "");
    renderSocial("social-links", profile?.socials || [], themeSettings);
    renderLinks("link-buttons", profile?.links || [], themeSettings);
    
    if (profile?.highlight_title) {
      const card = document.getElementById("highlight-card");
      card?.classList.remove("hidden");
      setText("highlight-title", profile.highlight_title);
      setText("highlight-body", profile.highlight_body);
      const link = document.getElementById("highlight-link");
      if (link) {
        if (profile.highlight_url) link.href = profile.highlight_url;
        // Apply button color to highlight link
        if (themeSettings.button_color) {
          if (themeSettings.button_color.startsWith("#")) {
            link.style.backgroundColor = themeSettings.button_color;
          } else if (themeSettings.button_color === "gradient") {
            link.classList.add("vibrant-gradient-bg");
          }
        }
        if (themeSettings.text_color) {
          link.style.color = themeSettings.text_color;
        }
      }
      // Apply text color to highlight texts
      if (themeSettings.text_color) {
        const titleEl = document.getElementById("highlight-title");
        const bodyEl = document.getElementById("highlight-body");
        if (titleEl) titleEl.style.color = themeSettings.text_color;
        if (bodyEl) bodyEl.style.color = themeSettings.text_color;
      }
    }
    injectAds();
  } catch (err) {
    console.error(err);
    document.getElementById("profile-error").classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await supabase.auth.getSession(); // warm up
  renderPublicProfile();
});

