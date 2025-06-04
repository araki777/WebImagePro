import { api } from "@/lib/api";
import {
  createUserProfiles,
  createUserRoles,
  createUserSettings,
  fetchUserProfiles,
  fetchUserRoles,
  fetchUserSettings,
} from "@/lib/api/user";
import {
  deleteSessionCache,
  getSessionCache,
  setSessionCache,
} from "@/lib/cache/session";
import { supabase } from "@/lib/supabase";
import {
  AuthState,
  UserProfiles,
  UserRoles,
  UserSettings,
} from "@/types/types";
import { Session } from "@supabase/supabase-js";
import { create } from "zustand";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userSettings: null,
  userProfiles: null,
  userRoles: null,
  setUser: (user) => set({ user }),
  checkUser: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("セッションが存在しません");

      await fetchSessionData(session);

      // 認証状態の変更を監視（一度だけ登録）
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT") {
          if (session?.access_token) {
            await deleteSessionCache(session.access_token);
          }
          set({
            user: null,
            userSettings: null,
            userProfiles: null,
            userRoles: null,
          });
          window.location.href = "/login";
        } else if (event === "TOKEN_REFRESHED") {
          if (session) {
            try {
              await fetchSessionData(session);
            } catch (error) {
              console.error("ユーザー設定取得エラー:", error);
              throw new Error("ユーザー設定取得エラー");
            }
          }
        }
      });
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("認証エラー:", error);
      set({ user: null, userSettings: null });
      if (
        error instanceof Error &&
        error.message.includes("Invalid Refresh Token")
      ) {
        window.location.href = "/login";
      }
    }
  },
  signOut: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        await deleteSessionCache(session.access_token);
      }
      await supabase.auth.signOut();
      set({ user: null, userSettings: null });
      window.location.href = "/login";
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  },
  updateUserSettings: async (settings: Partial<UserSettings>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const res = await api.update<{ data: UserSettings[] }>(
        "user_settings",
        user.id,
        settings
      );
      const data = res.data;
      if (data && data.length > 0) {
        set({ userSettings: data[0] });

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("セッションが存在しません");

        // 既存キャッシュを取得してマージ
        const currentCache = await getSessionCache(session.access_token);
        await setSessionCache(session.access_token, {
          ...currentCache,
          settings: data[0],
        });
      }
    } catch (error) {
      console.error("設定更新エラー:", error);
    }
  },
  updateUserProfiles: async (profiles: Partial<UserProfiles>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const res = await api.update<{ data: UserProfiles[] }>(
        "user_profiles",
        user.id,
        profiles
      );
      const data = res.data;
      if (data && data.length > 0) {
        set({ userProfiles: data[0] });

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("セッションが存在しません");

        // 既存キャッシュを取得してマージ
        const currentCache = await getSessionCache(session.access_token);
        await setSessionCache(session.access_token, {
          ...currentCache,
          profiles: data[0],
        });
      }
    } catch (error) {
      console.error("ユーザー情報更新エラー:", error);
    }
  },
  updateUserRoles: async (roles: Partial<UserRoles>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const res = await api.update<{ data: UserRoles[] }>(
        "user_roles",
        user.id,
        roles
      );
      const data = res.data;
      if (data && data.length > 0) {
        set({ userRoles: data[0] });

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("セッションが存在しません");

        // 既存キャッシュを取得してマージ
        const currentCache = await getSessionCache(session.access_token);
        await setSessionCache(session.access_token, {
          ...currentCache,
          roles: data[0],
        });
      }
    } catch (error) {
      console.error("ユーザー権限更新エラー:", error);
    }
  },
}));

// セッションデータを取得する関数
async function fetchSessionData(session: Session) {
  try {
    if (!session) {
      console.error("セッションが存在しません");
      return;
    }
    const cached = await getSessionCache(session.access_token);
    let userSettings = cached?.settings;
    let userProfiles = cached?.profiles;
    let userRoles = cached?.roles;

    // いずれかがnull/undefinedならDB/APIから取得・なければ作成
    if (!userSettings) {
      userSettings =
        (await fetchUserSettings(session.user.id)) ||
        (await createUserSettings(session.user));
    }
    if (!userProfiles) {
      userProfiles =
        (await fetchUserProfiles(session.user.id)) ||
        (await createUserProfiles(session.user));
    }
    if (!userRoles) {
      userRoles =
        (await fetchUserRoles(session.user.id)) ||
        (await createUserRoles(session.user));
    }

    // 全て揃っていればstoreとキャッシュを更新
    if (userSettings && userProfiles && userRoles) {
      useAuthStore.setState({
        user: session.user,
        userSettings,
        userProfiles,
        userRoles,
      });
      await setSessionCache(session.access_token, {
        settings: userSettings,
        profiles: userProfiles,
        roles: userRoles,
      });
    } else {
      console.error("一部のユーザーデータが取得・作成できませんでした");
    }
  } catch (error) {
    console.error("セッションデータ取得エラー:", error);
    throw new Error("セッションデータ取得エラー");
  }
}
