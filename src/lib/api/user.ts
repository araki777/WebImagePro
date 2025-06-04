import { DEFAULT_LANGUAGE } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { UserProfiles, UserRoles, UserSettings } from "@/types/types";
import { User } from "@supabase/supabase-js";

export async function fetchUserProfiles(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserProfiles | null;
}

export async function createUserProfiles(user: User) {
  const defaultProfiles: UserProfiles = {
    id: user.id,
    display_name: user.user_metadata.full_name,
    avatar_url: user.user_metadata.avatar_url,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("user_profiles")
    .insert([defaultProfiles]);
  if (error) throw error;
  return defaultProfiles;
}

export async function fetchUserSettings(userId: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserSettings | null;
}

export async function createUserSettings(user: User) {
  const defaultSettings: UserSettings = {
    id: user.id,
    theme: "light",
    language: DEFAULT_LANGUAGE,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("user_settings")
    .insert([defaultSettings]);
  if (error) throw error;
  return defaultSettings;
}

export async function fetchUserRoles(userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserRoles | null;
}

export async function createUserRoles(user: User) {
  const { data: roles } = await supabase
    .from("roles")
    .select("*")
    .eq("name", "User")
    .limit(1);
  const defaultRole = roles?.[0];
  const defaultUserRoles: UserRoles = {
    id: user.id,
    role_id: defaultRole?.id,
    created_at: new Date().toISOString(),
  };
  if (defaultRole) {
    const { error } = await supabase
      .from("user_roles")
      .insert([defaultUserRoles]);
    if (error) throw error;
  } else {
    await supabase.from("roles").insert([{ name: "User" }]);
  }
  return defaultUserRoles;
}
