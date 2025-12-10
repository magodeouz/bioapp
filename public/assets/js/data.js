import { supabase } from "./supabaseClient.js";

// Profiles
export async function upsertProfile(profile) {
  const { data, error } = await supabase.from("profiles").upsert(profile).select().single();
  if (error) throw error;
  return data;
}

export async function getProfileByUserId(userId) {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(username) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, links(*), themes(*)")
    .eq("username", username)
    .single();
  if (error) throw error;
  return data;
}

// Links
export async function listLinks(userId) {
  const { data, error } = await supabase
    .from("links")
    .select("*")
    .eq("user_id", userId)
    .order("order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createLink(link) {
  const { data, error } = await supabase.from("links").insert(link).select().single();
  if (error) throw error;
  return data;
}

export async function updateLink(id, changes) {
  const { data, error } = await supabase.from("links").update(changes).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLink(id) {
  const { error } = await supabase.from("links").delete().eq("id", id);
  if (error) throw error;
}

// Themes
export async function listThemes() {
  const { data, error } = await supabase.from("themes").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveTheme(theme) {
  const { data, error } = await supabase.from("themes").upsert(theme).select().single();
  if (error) throw error;
  return data;
}

export async function setActiveTheme(userId, themeId) {
  const { data, error } = await supabase.from("profiles").update({ active_theme_id: themeId }).eq("id", userId).select().single();
  if (error) throw error;
  return data;
}

// Storage
export async function uploadAvatar(userId, file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return publicUrl;
}

export async function uploadBackgroundImage(userId, file) {
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-bg-${Date.now()}.${fileExt}`;
  const filePath = `backgrounds/${fileName}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
    upsert: false,
  });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
  return publicUrl;
}

