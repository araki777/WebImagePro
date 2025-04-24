import { supabase } from "@/lib/supabase";
import { ISendEmailParams } from "@/types/types";

// 認証トークンを取得する関数
async function getAuthToken(): Promise<string | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
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
      let errorData: Record<string, unknown> = {};
      try {
        errorData = await response.json();
      } catch {
        // JSONでない場合や空の場合
        errorData = { message: await response.text() };
      }
      throw new Error(
        (errorData as { message?: string; error?: string }).message ||
          (errorData as { message?: string; error?: string }).error ||
          "APIリクエストに失敗しました"
      );
    }

    const responseData = await response.json();
    return responseData as T;
  } catch (error) {
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

  /**
   * メールを送信する
   */
  async send({
    to,
    subject,
    message,
    from,
    name,
    email,
  }: ISendEmailParams): Promise<{
    success: boolean;
    message?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error?: any;
  }> {
    try {
      const response = await fetchApi<{
        success: boolean;
        message?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error?: any;
      }>("POST", `/api/send`, { to, subject, message, from, name, email });
      return response;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(error.message || "メール送信に失敗しました");
    }
  },
};
