import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { AuthState, IUserData, UserSettings } from "@/types/types";
import { create } from "zustand";

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  userSettings: null,
  setUser: (user) => set({ user }),
  checkUser: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        set({ user: null, isLoading: false, userSettings: null });
        window.location.href = "/login";
        return;
      }

      // Redisからキャッシュされたユーザー情報を取得
      const response = await fetch(`/api/cache/user?userId=${user.id}`);
      const { user: cachedUser } = await response.json();

      if (cachedUser) {
        set({
          user: cachedUser,
          isLoading: false,
        });
      } else {
        const userData: IUserData = {
          id: user.id,
          email: user.email || "",
          user_metadata: user.user_metadata,
        };

        // ユーザー情報をRedisにキャッシュ
        await fetch("/api/cache/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            userData,
          }),
        });

        set({
          user: userData,
          isLoading: false,
        });
      }

      // ユーザー設定を取得
      await fetchUserSettings(user.id);

      // 認証状態の変更を監視（一度だけ登録）
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT") {
          // ログアウト時にキャッシュを削除
          if (user) {
            await fetch(`/api/cache/user?userId=${user.id}`, {
              method: "DELETE",
            });
          }
          set({ user: null, userSettings: null, isLoading: false });
          window.location.href = "/login";
        } else if (event === "TOKEN_REFRESHED") {
          if (session?.user) {
            try {
              const userData = {
                id: session.user.id,
                email: session.user.email || "",
                user_metadata: session.user.user_metadata,
              };

              // キャッシュを更新
              await fetch("/api/cache/user", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: session.user.id,
                  userData,
                }),
              });

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
        } else if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email || "",
            user_metadata: session.user.user_metadata,
          };

          // キャッシュを更新
          await fetch("/api/cache/user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: session.user.id,
              userData,
            }),
          });

          set({
            user: userData,
            isLoading: false,
          });
          // ユーザー設定を再取得
          fetchUserSettings(session.user.id);
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
        data: { user },
      } = await supabase.auth.getUser();

      // ログアウト時にキャッシュを削除
      if (user) {
        await fetch(`/api/cache/user?userId=${user.id}`, {
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
    // APIを使用してユーザー設定を取得
    try {
      const data = await api.get<UserSettings[]>("user_settings", userId);
      if (data && data.length > 0) {
        useAuthStore.setState({ userSettings: data[0] });
      }
    } catch (error) {
      // エラーの内容を確認して、設定が存在しない場合は新規作成
      if (error instanceof Error && error.message.includes("PGRST116")) {
        await createUserSettings(userId);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("ユーザー設定取得エラー:", error);
  }
}

// ユーザー設定を新規作成する関数
async function createUserSettings(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        theme: "light",
        language: "ja-JP",
        subscription_status: null,
        subscription_id: null,
        subscription_end_date: null,
        stripe_customer_id: null,
      })
      .select();

    if (error) {
      console.error("ユーザー設定作成エラー:", error);
      if (error.code === "42501") {
        console.error(
          "RLSポリシーエラー: テーブルへのアクセス権限がありません"
        );
      }
      return;
    }

    if (data && data.length > 0) {
      useAuthStore.setState({ userSettings: data[0] });
    }
  } catch (error) {
    console.error("ユーザー設定作成エラー:", error);
  }
}
