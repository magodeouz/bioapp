import { requireAuth } from "./auth.js";
import { upsertProfile, getProfileByUserId } from "./data.js";

const THEME_PRESETS = {
  aurora: {
    background_color: "gradient",
    background_image: "",
    button_color: "gradient",
    text_color: "#f9f9fb",
    font_family: "Inter",
    button_shape: "pill",
    is_dark_mode: false,
  },
  midnight: {
    background_color: "#0f172a",
    background_image: "",
    button_color: "#6366F1",
    text_color: "#f9f9fb",
    font_family: "Inter",
    button_shape: "pill",
    is_dark_mode: true,
  },
  sunny: {
    background_color: "#fef3c7",
    background_image: "",
    button_color: "#f59e0b",
    text_color: "#111827",
    font_family: "Poppins",
    button_shape: "rounded",
    is_dark_mode: false,
  },
  mono: {
    background_color: "#f8fafc",
    background_image: "",
    button_color: "#111827",
    text_color: "#111827",
    font_family: "Inter",
    button_shape: "rounded",
    is_dark_mode: false,
  },
  ocean: {
    background_color: "#0ea5e9",
    background_image: "",
    button_color: "#0f172a",
    text_color: "#e0f2fe",
    font_family: "Inter",
    button_shape: "pill",
    is_dark_mode: false,
  },
  forest: {
    background_color: "#0f172a",
    background_image: "",
    button_color: "#16a34a",
    text_color: "#e2e8f0",
    font_family: "Inter",
    button_shape: "pill",
    is_dark_mode: true,
  },
  coral: {
    background_color: "#fff7ed",
    background_image: "",
    button_color: "#f97316",
    text_color: "#111827",
    font_family: "Poppins",
    button_shape: "rounded",
    is_dark_mode: false,
  },
  neon: {
    background_color: "#0f172a",
    background_image: "",
    button_color: "gradient",
    text_color: "#f8fafc",
    font_family: "Inter",
    button_shape: "pill",
    is_dark_mode: true,
  },
  pastel: {
    background_color: "#f8fafc",
    background_image: "",
    button_color: "#c084fc",
    text_color: "#111827",
    font_family: "Poppins",
    button_shape: "rounded",
    is_dark_mode: false,
  },
  slate: {
    background_color: "#e2e8f0",
    background_image: "",
    button_color: "#334155",
    text_color: "#0f172a",
    font_family: "Inter",
    button_shape: "rounded",
    is_dark_mode: false,
  },
};

let currentPreset = "aurora";
let currentSettings = { ...THEME_PRESETS.aurora };

function updatePreview() {
  const bg = document.getElementById("preview-background");
  const links = document.getElementById("preview-links")?.querySelectorAll("a");
  const name = document.getElementById("preview-name");
  const bio = document.getElementById("preview-bio");
  const avatar = document.getElementById("preview-avatar");

  if (bg) {
    if (currentSettings.background_image) {
      bg.style.backgroundImage = `url("${currentSettings.background_image}")`;
      bg.style.backgroundColor = "transparent";
    } else if (currentSettings.background_color === "gradient") {
      bg.style.background = "linear-gradient(135deg, #818CF8 0%, #4F46E5 50%, #3730A3 100%)";
    } else {
      bg.style.background = currentSettings.background_color || "#f8fafc";
    }
  }

  if (links && links.length) {
    links.forEach((a, idx) => {
      const isPrimary = idx === 0;
      a.style.borderRadius = currentSettings.button_shape === "pill" ? "9999px" : "12px";
      if (isPrimary) {
        if (currentSettings.button_color === "gradient") {
          a.classList.add("vibrant-gradient-bg");
          a.style.backgroundColor = "";
        } else {
          a.classList.remove("vibrant-gradient-bg");
          a.style.backgroundColor = currentSettings.button_color || "#4F46E5";
        }
        a.style.color = "#fff";
      } else {
        a.classList.remove("vibrant-gradient-bg");
        a.style.backgroundColor = "#ffffffd0";
        a.style.color = currentSettings.text_color || "#111827";
      }
    });
  }

  if (name) name.style.color = currentSettings.text_color || "#fff";
  if (bio) bio.style.color = currentSettings.text_color || "#fff";
  if (avatar && currentSettings.button_color) {
    avatar.style.boxShadow = "0 10px 30px rgba(0,0,0,0.2)";
  }
}

async function savePreset(presetKey) {
  const session = await requireAuth("/auth/login.html");
  if (!session) return;
  const userId = session.user.id;

  const profile = await getProfileByUserId(userId).catch(() => null);
  const username =
    profile?.username ||
    (session.user.email?.includes("@")
      ? session.user.email.split("@")[0]
      : `user-${userId.slice(0, 6)}`);

  const preset = THEME_PRESETS[presetKey];
  if (!preset) return;

  await upsertProfile({
    id: userId,
    username,
    ...preset,
  });
}

function bindPresetButtons() {
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const key = btn.dataset.preset;
      currentPreset = key;
      currentSettings = { ...THEME_PRESETS[key] };
      updatePreview();
    });
  });

  const applyBtn = document.getElementById("apply-preset-btn");
  if (applyBtn) {
    applyBtn.addEventListener("click", async () => {
      try {
        applyBtn.setAttribute("disabled", "true");
        await savePreset(currentPreset);
        window.location.href = "/onboarding/platforms.html";
      } catch (err) {
        alert("Tema uygulanamadı: " + err.message);
      } finally {
        applyBtn.removeAttribute("disabled");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindPresetButtons();
  updatePreview();
});

