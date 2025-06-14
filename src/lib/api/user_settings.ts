import { components } from "@/types/api";
import { apiClient } from "../api-client";

export const userSettingsApi = {
  get: async (): Promise<
    | components["schemas"]["UserSetting"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/user/me/setting", {
      method: "GET",
    });
    return response.json();
  },
  update: async (
    data: components["schemas"]["UserSettingUpdate"]
  ): Promise<
    | components["schemas"]["UserSetting"]
    | components["schemas"]["HTTPValidationError"]
  > => {
    const response = await apiClient("/users/me/setting", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return response.json();
  },
};
