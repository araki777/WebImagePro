// ユーザーデータの型定義
export interface IUserData {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
  };
}

// 基本的な画像データの型
export interface IBaseImage {
  url: string;
  name: string;
  contentType: string;
  size: number;
}

// API から取得した画像データ
export interface IApiImage extends IBaseImage {
  uploadedAt: string;
}

// 画像アップロード時のプレビュー用データ
export interface IImagePreview {
  file: File;
  preview: string;
}

// 画像リストの型定義
export interface IImageListProps {
  images: IApiImage[];
  onEditImage: (image: IApiImage) => void;
  onDownload: (image: IApiImage) => void;
  onDelete: (image: IApiImage) => void;
}

// 画像プレビューリストの型定義
export interface IImagePreviewListProps {
  images: IImagePreview[];
  onRemove: (index: number) => void;
  onEdit: (index: number) => void;
}

// 圧縮設定の型定義
export interface ICompressionSettings {
  enabled: boolean;
  quality: number;
  maxWidth: number;
  maxHeight: number;
}

// 圧縮設定のコンポーネントの props 型定義
export interface ICompressionSettingsProps {
  compressionSettings: ICompressionSettings;
  setCompressionSettings: React.Dispatch<React.SetStateAction<ICompressionSettings>>;
}

// 検索バーの型定義
export interface ISearchBarProps {
  query: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// 画像アップロードフォームの props 型定義
export interface IImageUploadFormProps extends ICompressionSettingsProps {
  setImages: React.Dispatch<React.SetStateAction<IImagePreview[]>>;
}

// 画像アップロードアクションの props 型定義
export interface IImageUploadActionsProps {
  images: IImagePreview[];
  setImages: React.Dispatch<React.SetStateAction<IImagePreview[]>>;
}
