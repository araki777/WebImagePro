import { supabase } from "@/lib/supabase";

// 認証トークンを取得する関数
async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error("認証トークン取得エラー:", error);
    return null;
  }
}

// APIリクエストのベース関数
async function fetchApi<T>(
  method: string,
  url: string,
  data?: unknown
): Promise<T> {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error("認証が必要です");
    }

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "APIリクエストに失敗しました");
    }

    const responseData = await response.json();
    return responseData.data as T;
  } catch (error) {
    console.error(`API ${method} エラー:`, error);
    throw error;
  }
}

/**
 * データの操作に関する関数
 */
type TableData = Record<string, unknown>;

export const api = {
  /**
   * データを作成する
   */
  async create<T = unknown>(table: string, data: TableData): Promise<T> {
    return fetchApi<T>("POST", "/api/supabase", {
      table,
      data,
    });
  },

  /**
   * データを更新する
   */
  async update<T = unknown>(
    table: string,
    id: string,
    data: TableData
  ): Promise<T> {
    return fetchApi<T>("PUT", "/api/supabase", {
      table,
      id,
      data,
    });
  },

  /**
   * データを取得する
   */
  async get<T = unknown>(table: string, id?: string): Promise<T> {
    const params = new URLSearchParams({ table });
    if (id) {
      params.append("id", id);
    }
    return fetchApi<T>("GET", `/api/supabase?${params.toString()}`);
  },

  /**
   * データを削除する
   */
  async remove(table: string, id: string): Promise<{ success: boolean }> {
    const params = new URLSearchParams({ table, id });
    return fetchApi<{ success: boolean }>(
      "DELETE",
      `/api/supabase?${params.toString()}`
    );
  },
};
