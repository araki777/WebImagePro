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

// 画像リサイズの props 型定義
export interface IImageResizerProps {
  resizeWidth: number;
  resizeHeight: number;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onSizeReset: () => void;
  onAspectRatioChange: () => void;
  maintainAspectRatio: boolean;
}

export interface IImageCliperProps {
  selectedRatio: { name: string; value: number | null };
  onRatioChange: (ratio: { name: string; value: number | null }) => void;
  onClip: () => void;
  isResizing: boolean;
}

// 画像エディターの props 型定義
export interface IImageEditorProps {
  imageUrl: string;
  onSave: (editedImage: string, isNewImage: boolean) => void;
  onClose: () => void;
}

// 画像エディターの座標の型定義
export interface IPosition {
  x: number;
  y: number;
}

// 画像エディターの切り抜き領域の型定義
export interface IClipRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 画像エディターのリサイズハンドルの型定義
export type ResizeHandle = "se" | "e" | "s";
export interface IImageCliperContolesProps {
  clipRegion: { x: number; y: number; width: number; height: number };
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>, handle?: ResizeHandle) => void;
}