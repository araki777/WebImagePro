import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { AuthState, IUserData, UserSettings } from "@/types/types";
import { Session } from "@supabase/supabase-js";
import { create } from "zustand";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  userSettings: null,
  setUser: (user) => set({ user }),
  checkUser: async () => {
    try {
      // セッションを取得
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        set({ user: null, isLoading: false, userSettings: null });
        window.location.href = "/login";
        return;
      }

      // キャッシュからセッションデータを取得
      const sessionResponse = await fetch(
        `/api/cache/session?sessionId=${session.access_token}`
      );
      const { session: cachedSession } = await sessionResponse.json();

      // キャッシュが有効な場合はそれを使用
      if (
        cachedSession &&
        session.expires_at &&
        session.expires_at * 1000 > Date.now()
      ) {
        const userData: IUserData = {
          id: cachedSession.user.id,
          email: cachedSession.user.email || "",
          user_metadata: cachedSession.user.user_metadata,
        };

        set({
          user: userData,
          isLoading: false,
          userSettings: cachedSession.settings,
        });
        return;
      }

      // キャッシュが無効な場合のみ新規保存
      const userData: IUserData = {
        id: session.user.id,
        email: session.user.email || "",
        user_metadata: session.user.user_metadata,
      };

      set({
        user: userData,
        isLoading: false,
      });

      // ユーザー設定を取得（キャッシュの保存も含む）
      await createUserSettings(userData.id, session);

      // 認証状態の変更を監視（一度だけ登録）
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT") {
          // ログアウト時にキャッシュを削除
          if (session?.access_token) {
            await fetch(
              `/api/cache/session?sessionId=${session.access_token}`,
              {
                method: "DELETE",
              }
            );
          }
          set({ user: null, userSettings: null, isLoading: false });
          window.location.href = "/login";
        } else if (event === "TOKEN_REFRESHED") {
          if (session) {
            try {
              // 新しいセッションをキャッシュに保存
              await fetch("/api/cache/session", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  sessionId: session.access_token,
                  sessionData: session,
                }),
              });

              const userData: IUserData = {
                id: session.user.id,
                email: session.user.email || "",
                user_metadata: session.user.user_metadata,
              };

              set({
                user: userData,
                isLoading: false,
              });
              await fetchUserSettings(session.user.id);

              console.log("ユーザー設定取得成功");
            } catch (error) {
              console.error("ユーザー設定取得エラー:", error);
              set({ user: null, isLoading: false, userSettings: null });
              window.location.href = "/login";
            }
          }
        }
      });

      // クリーンアップ関数を返す
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error("認証エラー:", error);
      set({ user: null, isLoading: false, userSettings: null });
      // リフレッシュトークンのエラーの場合はログインページにリダイレクト
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

      // ログアウト時にキャッシュを削除
      if (session?.access_token) {
        await fetch(`/api/cache/session?sessionId=${session.access_token}`, {
          method: "DELETE",
        });
      }

      // サインアウト
      await supabase.auth.signOut();
      set({ user: null, isLoading: false, userSettings: null });
      // ログインページに直接リダイレクト
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

      // APIを使用してユーザー設定を更新
      const data = await api.update<UserSettings[]>(
        "user_settings",
        user.id,
        settings
      );

      // 設定を更新
      if (data && data.length > 0) {
        set({ userSettings: data[0] });
      }
    } catch (error) {
      console.error("設定更新エラー:", error);
    }
  },
}));

// ユーザー設定を取得する関数
async function fetchUserSettings(userId: string) {
  try {
    // セッションを取得
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.error("セッションが存在しません");
      return;
    }

    // キャッシュからセッションデータを取得
    const sessionResponse = await fetch(
      `/api/cache/session?sessionId=${session.access_token}`
    );
    const { settings: cachedSettings } = await sessionResponse.json();

    // キャッシュが有効な場合はそれを使用
    if (
      cachedSettings &&
      session.expires_at &&
      session.expires_at * 1000 > Date.now()
    ) {
      useAuthStore.setState({ userSettings: cachedSettings });
      return;
    }

    // キャッシュが無効な場合のみ新規作成
    await createUserSettings(userId, session);
  } catch (error) {
    console.error("ユーザー設定取得エラー:", error);
    // エラーの種類に関わらず、設定が存在しない場合は新規作成を試みる
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      await createUserSettings(userId, session);
    }
  }
}

// ユーザー設定を新規作成する関数
async function createUserSettings(userId: string, session: Session) {
  try {
    const defaultSettings: UserSettings = {
      id: crypto.randomUUID(),
      user_id: userId,
      theme: "light",
      language: "ja-JP",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subscription_status: null,
      subscription_id: null,
      subscription_end_date: null,
      stripe_customer_id: null,
    };

    // デフォルト設定をキャッシュに保存
    await fetch("/api/cache/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId: session.access_token,
        sessionData: session,
        settings: defaultSettings,
      }),
    });

    useAuthStore.setState({ userSettings: defaultSettings });
  } catch (error) {
    console.error("ユーザー設定作成エラー:", error);
    // エラーが発生した場合でも、デフォルト設定を適用
    const defaultSettings: UserSettings = {
      id: crypto.randomUUID(),
      user_id: userId,
      theme: "light",
      language: "ja-JP",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      subscription_status: null,
      subscription_id: null,
      subscription_end_date: null,
      stripe_customer_id: null,
    };

    useAuthStore.setState({ userSettings: defaultSettings });
  }
}
