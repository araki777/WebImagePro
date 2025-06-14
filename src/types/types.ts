// ============================================================================
// 認証関連の型定義
// ============================================================================

import { User } from "@supabase/supabase-js";

export interface HeaderProps {
  onLogout: () => Promise<void>;
  userImage?: string;
  userName?: string;
}

export interface UserProfiles {
  id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface UserRoles {
  id: string;
  role_id: string;
  created_at: string;
  updated_at?: string;
}

export interface UserSettings {
  id: string;
  theme: "light" | "dark" | "system";
  language: string;
  created_at: string;
  updated_at?: string;
}

export interface SessionItem {
  userSettings: UserSettings;
  userProfiles: UserProfiles;
  userRoles: UserRoles;
}

export interface AuthState {
  user: User | null;
  userSettings: UserSettings | null;
  userProfiles: UserProfiles | null;
  userRoles: UserRoles | null;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  checkUser: () => Promise<void | (() => void)>;
  signOut: () => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  updateUserProfiles: (profiles: Partial<UserProfiles>) => Promise<void>;
  updateUserRoles: (roles: Partial<UserRoles>) => Promise<void>;
  setAccessToken: (accessToken: string) => void;
}

// ============================================================================
// お問い合わせ関連の型定義
// ============================================================================

export interface IContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface IContact extends IContactForm {
  id: string;
  user_id: string | null;
  created_at: string;
  status: "pending" | "replied" | "closed";
}

// ============================================================================
// 画像データ関連の型定義
// ============================================================================

export interface IBaseImage {
  url: string;
  name: string;
  contentType: string;
  size: number;
}

export interface IApiImage extends IBaseImage {
  uploadedAt: string;
  tags: string[];
}

export interface ICompressionSettings {
  format: "JPEG" | "PNG" | "WebP";
  // JPEG
  quality?: number; // 画質 2-31
  width?: number; // リサイズ幅
  height?: number; // リサイズ高さ
  // PNG
  compression_level?: number; // 圧縮レベル 0-9
  // WebP
  lossless?: boolean; // ロスレス圧縮
  webp_quality?: number; // ロッシー時の品質 0-100
  enabled?: boolean;
  isShared?: boolean;
}

export interface IImagePreview {
  id: string;
  file: File;
  preview: string;
  compressionSettings: ICompressionSettings;
}

// ============================================================================
// 画像リスト関連の型定義
// ============================================================================

export interface IImageListProps {
  images: IApiImage[];
  onEditImage: (image: IApiImage) => void;
  onDownload: (image: IApiImage) => void;
  onDelete: (image: IApiImage) => void;
  className?: string;
}

export interface IImagePreviewListProps {
  images: IImagePreview[];
  onRemove: (index: number) => void;
  onCompressionSettingsChange: (
    index: number,
    settings: ICompressionSettings
  ) => void;
}

// ============================================================================
// 画像アップロード関連の型定義
// ============================================================================

export interface IImageUploadFormProps {
  setImages: React.Dispatch<React.SetStateAction<IImagePreview[]>>;
}

export interface IImageUploadActionsProps {
  images: IImagePreview[];
  setImages: React.Dispatch<React.SetStateAction<IImagePreview[]>>;
  userId: string | undefined;
}

// ============================================================================
// 画像編集関連の型定義
// ============================================================================

export interface IImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string, isNewImage: boolean, format: string) => void;
  onClose: () => void;
}

export interface IPosition {
  x: number;
  y: number;
}

export interface IClipRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeHandle = "se" | "e" | "s";

export interface IImageCliperContolesProps {
  clipRegion: IClipRegion;
  onMouseDown: (
    event: React.MouseEvent<HTMLDivElement>,
    handle?: ResizeHandle
  ) => void;
  onTouchStart: (
    event: React.TouchEvent<HTMLDivElement>,
    handle?: ResizeHandle
  ) => void;
}

// ============================================================================
// 画像変換コンポーネントの型定義
// ============================================================================

export interface IImageResizerProps {
  resizeWidth: number;
  resizeHeight: number;
  onWidthChange: (value: number) => void;
  onHeightChange: (value: number) => void;
  onAspectRatioChange: () => void;
  maintainAspectRatio: boolean;
}

export interface IImageCliperProps {
  selectedRatio: { name: string; value: number | null };
  onRatioChange: (ratio: { name: string; value: number | null }) => void;
  onClip: () => void;
  isSave: boolean;
}

export interface ImageTransformProps {
  onRotate: (degrees: number) => void;
  onFlip: (horizontal: boolean) => void;
  isSave: boolean;
}

// ============================================================================
// 画像フィルター関連の型定義
// ============================================================================

export interface IImageColorAjustmentProps {
  brightness: number;
  saturation: number;
  contrast: number;
  gamma: number;
  threshold: number;
  redFactor: number;
  greenFactor: number;
  blueFactor: number;
  isGrayScale: boolean;
  isSepia: boolean;
  isInvert: boolean;
  setBrightness: (brightness: number) => void;
  setSaturation: (saturation: number) => void;
  setContrast: (contrast: number) => void;
  setGamma: (gamma: number) => void;
  setThreshold: (threshold: number) => void;
  setRedFactor: (redFactor: number) => void;
  setGreenFactor: (greenFactor: number) => void;
  setBlueFactor: (blueFactor: number) => void;
  setIsGrayScale: (isGrayScale: boolean) => void;
  setIsSepia: (isSepia: boolean) => void;
  setIsInvert: (isInvert: boolean) => void;
  onBrightnessChange: (brightness: number) => void;
  onSaturationChange: (saturation: number) => void;
  onContrastChange: (contrast: number) => void;
  onGammaChange: (gamma: number) => void;
  onThresholdChange: (threshold: number) => void;
  onColorBalanceChange: (
    redFactor: number,
    greenFactor: number,
    blueFactor: number
  ) => void;
  onGrayscaleChange: (isGrayScale: boolean) => void;
  onSepiaChange: (isSepia: boolean) => void;
  onInvertChange: (isInvert: boolean) => void;
  isSave: boolean;
}

export interface IImageFilterProps {
  gaussianBlur: number;
  motionBlur: { angle: number; distance: number };
  sharpen: { sigma: number; threshold: number };
  edgeDetection: number;
  noiseReduction: number;
  vignette: number;
  hdr: number;
  mosaic: number;
  oilPainting: { radius: number; intensity: number };
  setGaussianBlur: (value: number) => void;
  setMotionBlur: (value: { angle: number; distance: number }) => void;
  setSharpen: (value: { sigma: number; threshold: number }) => void;
  setEdgeDetection: (value: number) => void;
  setNoiseReduction: (value: number) => void;
  setVignette: (value: number) => void;
  setHdr: (value: number) => void;
  setMosaic: (value: number) => void;
  setOilPainting: (value: { radius: number; intensity: number }) => void;
  onGaussianBlurChange: (value: number) => void;
  onMotionBlurChange: (angle: number, distance: number) => void;
  onSharpenChange: (sigma: number, threshold: number) => void;
  onEdgeDetectionChange: (value: number) => void;
  onNoiseReductionChange: (value: number) => void;
  onVignetteChange: (value: number) => void;
  onHdrChange: (value: number) => void;
  onMosaicChange: (value: number) => void;
  onOilPaintingChange: (radius: number, intensity: number) => void;
}

export interface IImageCompositionProps {
  onMakeTransparent: (threshold: number) => Promise<void>;
  onAddWatermark: (
    watermark: File,
    x: number,
    y: number,
    opacity: number
  ) => Promise<void>;
  onComposite: (overlay: File, x: number, y: number) => Promise<void>;
  onAddStamp: (stamp: File, x: number, y: number) => Promise<void>;
  isSave: boolean;
}

export interface IFormatOption {
  value: string;
  label: string;
}

export const IMAGE_FORMATS: IFormatOption[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPEG" },
  { value: "gif", label: "GIF" },
  { value: "bmp", label: "BMP" },
  { value: "webp", label: "WebP" },
];

// ============================================================================
// メール関連の型定義
// ============================================================================

export interface ISendEmailParams {
  to: string;
  subject: string;
  message: string;
  from: string;
  name: string;
  email: string;
}

// ============================================================================
// 画像タグ関連の型定義
// ============================================================================
export interface ITagsByLang {
  [lang: string]: string[];
}

export interface IDBImageRow {
  blob_name: string;
  container_name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
