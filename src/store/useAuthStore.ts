import { authApi } from "@/lib/api/auth";
import { components } from "@/types/api";
import { AuthState } from "@/types/types";
import { create } from "zustand";

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  userEmail: null,
  userSettings: null,
  userProfiles: null,
  userRoles: null,
  isAuthenticated: false,

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
          isAuthenticated: false,
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
          isAuthenticated: true,
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
        isAuthenticated: false,
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
      isAuthenticated: false,
    });
    window.location.href = "/login";
  },
  updateUserProfiles: (userProfiles: components["schemas"]["UserProfile"]) => {
    set({ userProfiles });
  },
  updateUserSettings: (userSettings: components["schemas"]["UserSetting"]) => {
    set({ userSettings });
  },
  updateUserRoles: (userRoles: components["schemas"]["UserRole"]) => {
    set({ userRoles });
  },
}));
