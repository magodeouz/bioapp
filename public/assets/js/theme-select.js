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
      try {
        btn.setAttribute("disabled", "true");
        await savePreset(key);
        window.location.href = "/onboarding/platforms.html";
      } catch (err) {
        alert("Tema uygulanamadı: " + err.message);
      } finally {
        btn.removeAttribute("disabled");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindPresetButtons();
});

