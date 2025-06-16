import { authApi } from "@/lib/api/auth";
import { AuthState } from "@/types/types";
import { create } from "zustand";

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  userSettings: null,
  userProfiles: null,
  userRoles: null,
  checkUser: async () => {
    try {
      const response = await authApi.getMe();

      if (!response) {
        set({
          userId: null,
          userSettings: null,
          userProfiles: null,
          userRoles: null,
        });
        window.location.href = "/login";
        return;
      }

      set({
        userId: response.id,
        userSettings: response.user_setting,
        userProfiles: response.user_profile,
        userRoles: response.user_role,
      });
    } catch (error) {
      console.error("認証エラー:", error);
      set({
        userId: null,
        userSettings: null,
        userProfiles: null,
        userRoles: null,
      });
      window.location.href = "/login";
    }
  },
}));
