import { authApi } from "@/lib/api/auth";
import { AuthState } from "@/types/types";
import { create } from "zustand";

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  userEmail: null,
  userSettings: null,
  userProfiles: null,
  userRoles: null,
  checkUser: async () => {
    try {
      const response = await authApi.getMe();

      if (!response || "detail" in response) {
        console.error("認証エラー:", response?.detail);
        set({
          userId: null,
          userEmail: null,
          userSettings: null,
          userProfiles: null,
          userRoles: null,
        });
        window.location.href = "/login";
        return;
      }

      if ("id" in response) {
        set({
          userId: response.id,
          userEmail: response.email,
          userSettings: response.user_setting,
          userProfiles: response.user_profile,
          userRoles: response.user_role,
        });
        return;
      }
    } catch (error) {
      console.error("認証エラー:", error);
      set({
        userId: null,
        userEmail: null,
        userSettings: null,
        userProfiles: null,
        userRoles: null,
      });
      window.location.href = "/login";
    }
  },
  signOut: async () => {
    await authApi.signout();
    set({
      userId: null,
      userEmail: null,
      userSettings: null,
      userProfiles: null,
      userRoles: null,
    });
    window.location.href = "/login";
  },
}));
