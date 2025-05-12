import { Button } from "@/components/ui/button";
import { compressImageWithFFmpeg } from "@/lib/ffmpegCompress";
import { IImageUploadActionsProps } from "@/types/types";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function ImageUploadActions({
  images,
  setImages,
}: IImageUploadActionsProps) {
  const t = useTranslations("ImageUploadActions");
  const [isUploading, setIsUploading] = useState(false);

  // 画像をアップロードする関数
  const handleUpload = async () => {
    if (images.length === 0) return;

    setIsUploading(true);

    // 画像ごとにcompressionSettingsを参照し、必要なら圧縮
    const processedImages = await Promise.all(
      images.map(async (image) => {
        if (image.compressionSettings.enabled) {
          const compressedFile = await compressImageWithFFmpeg(
            image.file,
            image.compressionSettings
          );
          return { ...image, file: compressedFile };
        }
        return image;
      })
    );

    // 画像ごとにアップロード処理を行う
    const uploadPromises = processedImages.map(async (image) => {
      try {
        const formData = new FormData();
        formData.append("file", image.file);

        // APIへ画像ファイルをPOSTリクエストで送信
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(t("uploadFailed"));
        }

        // レスポンスからURLを取得
        const data = await response.json();
        return data.url;
      } catch (error) {
        console.error("アップロードエラー:", error);
        throw error;
      }
    });

    // 複数の画像アップロードの状態管理
    toast.promise(Promise.all(uploadPromises), {
      loading: t("uploading"),
      success: () => {
        setImages([]); // アップロード完了後は画像をクリア
        setIsUploading(false);
        return t("uploadSuccess", { count: images.length });
      },
      error: () => {
        setIsUploading(false);
        return t("uploadFailed");
      },
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleUpload}
        disabled={images.length === 0 || isUploading}
        className={`flex-1 upload-button${isUploading ? " opacity-50 cursor-not-allowed" : ""}`}
      >
        {isUploading ? (
          <span className="mr-2 h-4 w-4 animate-spin">
            {/* ローディングインジケーター（例: スピナーアイコン） */}
            <svg
              className="animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          </span>
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        {images.length > 0
          ? t("uploadButton", { count: images.length })
          : t("upload")}
      </Button>
    </div>
  );
}
