// ============================================================================
// 認証関連の型定義
// ============================================================================

export interface HeaderProps {
  onLogout: () => Promise<void>;
  userImage?: string;
  userName?: string;
}

export interface IUserData {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
    provider?: string;
    display_name?: string;
    bio?: string;
  };
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: "light" | "dark" | "system";
  language: string;
  created_at: string;
  updated_at: string;
  subscription_status: "active" | "canceled" | "past_due" | "unpaid" | null;
  subscription_id: string | null;
  subscription_end_date: string | null;
  stripe_customer_id: string | null;
}

export interface AuthState {
  user: IUserData | null;
  isLoading: boolean;
  setUser: (user: IUserData | null) => void;
  checkUser: () => Promise<void | (() => void)>;
  signOut: () => Promise<void>;
  userSettings: UserSettings | null;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
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
}

export interface IImagePreview {
  file: File;
  preview: string;
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
}

// ============================================================================
// 画像アップロード関連の型定義
// ============================================================================

export interface ICompressionSettings {
  enabled: boolean;
  quality: number;
  maxWidth: number;
  maxHeight: number;
}

export interface ICompressionSettingsProps {
  compressionSettings: ICompressionSettings;
  setCompressionSettings: React.Dispatch<
    React.SetStateAction<ICompressionSettings>
  >;
}

export interface ISearchBarProps {
  query: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export interface IImageUploadFormProps extends ICompressionSettingsProps {
  setImages: React.Dispatch<React.SetStateAction<IImagePreview[]>>;
}

export interface IImageUploadActionsProps {
  images: IImagePreview[];
  setImages: React.Dispatch<React.SetStateAction<IImagePreview[]>>;
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
