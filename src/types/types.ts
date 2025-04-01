// ユーザーデータの型定義
export interface UserData {
    id: string;
    email: string | undefined;
    user_metadata: {
      avatar_url?: string;
      full_name?: string;
    };
  }