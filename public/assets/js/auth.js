import { supabase } from "./supabaseClient.js";

export async function signUp({ email, password, fullName, username }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, username },
      emailRedirectTo: `${window.location.origin}/themes/select.html`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function requireAuth(redirectTo = "/auth/login.html") {
  const session = await getSession();
  if (!session) {
    window.location.href = redirectTo;
    return null;
  }
  return session;
}

export function bindAuthGuard() {
  document.addEventListener("DOMContentLoaded", async () => {
    await requireAuth();
  });
}

export function bindLogout(selector = "[data-logout]") {
  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await signOut();
        window.location.href = "/auth/login.html";
      } catch (err) {
        console.error(err);
        alert("Çıkış yapılamadı: " + err.message);
      }
    });
  });
}

