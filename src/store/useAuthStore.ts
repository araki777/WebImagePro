import { create } from 'zustand';
import { AuthState, UserSettings } from '@/types/types';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';

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

      // APIを使用してユーザー設定を更新
      const data = await api.update<UserSettings[]>('user_settings', user.id, settings);
      
      // 設定を更新
      if (data && data.length > 0) {
        set({ userSettings: data[0] });
      }
    } catch (error) {
      console.error('設定更新エラー:', error);
    }
  },
}));

// ユーザー設定を取得する関数
async function fetchUserSettings(userId: string) {
  try {
    // APIを使用してユーザー設定を取得
    try {
      const data = await api.get<UserSettings[]>('user_settings', userId);
      if (data && data.length > 0) {
        useAuthStore.setState({ userSettings: data[0] });
      } else {
        // 設定が存在しない場合は新規作成
        await createUserSettings(userId);
      }
    } catch (error) {
      // エラーの内容を確認して、設定が存在しない場合は新規作成
      if (error instanceof Error && error.message.includes('PGRST116')) {
        await createUserSettings(userId);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('ユーザー設定取得エラー:', error);
  }
}

// ユーザー設定を新規作成する関数
async function createUserSettings(userId: string) {
  try {
    const data = await api.create<UserSettings[]>('user_settings', {
      user_id: userId,
      theme: "system",
      language: "ja",
      subscription_status: null,
      subscription_id: null,
      subscription_end_date: null,
      stripe_customer_id: null,
    });
    
    if (data && data.length > 0) {
      useAuthStore.setState({ userSettings: data[0] });
    }
  } catch (error) {
    console.error('ユーザー設定作成エラー:', error);
  }
}