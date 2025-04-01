// ユーザーデータの型定義
export interface UserData {
    id: string;
    email: string | undefined;
    user_metadata: {
      avatar_url?: string;
      full_name?: string;
    };
  };

// 画像データの型定義
export interface ApiImage {
  url: string;
  name: string;
  contentType: string;
  size: number;
  uploadedAt: string;
};

// 画像リストの型定義
export interface ImageListProps {
  images: ApiImage[];
  onEditImage: (image: ApiImage) => void;
  onDownload: (image: ApiImage) => void;
  onDelete: (image: ApiImage) => void;
};

// 検索バーの型定義
export interface SearchBarProps {
  query: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
