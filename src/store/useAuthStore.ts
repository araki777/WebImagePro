import { create } from 'zustand';
import { AuthState, UserSettings } from '@/types/types';
import { supabase } from '@/lib/supabase';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  userSettings: null,
  setUser: (user) => set({ user }),
  checkUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        set({ user: null, isLoading: false, userSettings: null });
        return;
      }

      set({
        user: {
          id: user.id,
          email: user.email || '',
          user_metadata: user.user_metadata
        },
        isLoading: false
      });

      // ユーザー設定を取得
      await fetchUserSettings(user.id);

      // 認証状態の変更を監視（一度だけ登録）
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null, userSettings: null, isLoading: false });
        } else if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata
            },
            isLoading: false
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
      console.error('認証エラー:', error);
      set({ user: null, isLoading: false, userSettings: null });
    }
  },
  signOut: async () => {
    try {
      // サインアウト
      await supabase.auth.signOut();
      // ユーザー状態をクリア
      set({ user: null, isLoading: false, userSettings: null });
      // ログインページに直接リダイレクト
      window.location.href = '/login';
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  },
  updateUserSettings: async (settings: Partial<UserSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_settings")
        .update(settings)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      set({ userSettings: data });
    } catch (error) {
      console.error('設定更新エラー:', error);
    }
  },
}));

// ユーザー設定を取得する関数
async function fetchUserSettings(userId: string) {
  try {
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // 設定が存在しない場合は新規作成
        const { data: newSettings, error: createError } = await supabase
          .from("user_settings")
          .insert([
            {
              user_id: userId,
              theme: "system",
              language: "ja",
              subscription_status: null,
              subscription_id: null,
              subscription_end_date: null,
              stripe_customer_id: null,
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        useAuthStore.setState({ userSettings: newSettings });
      } else {
        throw error;
      }
    } else {
      useAuthStore.setState({ userSettings: settings });
    }
  } catch (error) {
    console.error('ユーザー設定取得エラー:', error);
  }
}