import { Button } from "@/components/ui/button";
import { IImageUploadActionsProps } from "@/types/types";
import { Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useImageCompression } from "@/hooks/useImageCompression";
import { DEFAULT_COMPRESSION_SETTINGS } from "@/lib/constants";

export function ImageUploadActions({
  images,
  setImages,
  compressionSettings,
}: IImageUploadActionsProps) {
  const t = useTranslations("ImageUploadActions");
  const [isUploading, setIsUploading] = useState(false);

  const { imageCompression } = useImageCompression();

  // 画像をアップロードする関数
  const handleUpload = async () => {
    if (images.length === 0) return;

    setIsUploading(true);

    // 画像ごとにアップロード処理を行う
    const uploadPromises = images.map(async (image) => {
      try {
        // 画像を圧縮
        const compressedImage = await imageCompression(
          image.file,
          compressionSettings || DEFAULT_COMPRESSION_SETTINGS
        );

        const formData = new FormData();
        formData.append("file", compressedImage);

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
        disabled={images.length === 0}
        className="flex-1 upload-button"
        isLoading={isUploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {images.length > 0
          ? t("uploadButton", { count: images.length })
          : t("upload")}
      </Button>
    </div>
  );
}
