import { create } from 'zustand';
import { IUserData } from '@/types/types';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: IUserData | null;
  isLoading: boolean;
  setUser: (user: IUserData | null) => void;
  checkUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  checkUser: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        set({ user: null, isLoading: false });
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

      // 認証状態の変更を監視
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null });
        } else if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              user_metadata: session.user.user_metadata
            }
          });
        }
      });
    } catch (error) {
      console.error('認証エラー:', error);
      set({ user: null, isLoading: false });
    }
  },
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  },
}));