import { Input } from "@/components/ui/input";
import { compressImageWithFFmpeg } from "@/lib/ffmpegCompress";
import { IImagePreview, IImageUploadFormProps } from "@/types/types";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function ImageUploadForm({ setImages }: IImageUploadFormProps) {
  const t = useTranslations("ImageUploadForm");
  // 画像ファイルが変更されたときの処理
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // 画像ファイルのみをフィルタリング
      const newFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (newFiles.length !== e.target.files.length) {
        toast.error(t("onlyImageError"));
      }

      // 画像ファイルをBase64に変換してプレビューを作成
      const promises = newFiles.map((file) => {
        return new Promise<IImagePreview>(async (resolve) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const img = new window.Image();
            img.onload = async () => {
              // デフォルトの圧縮設定
              const compressionSettings = {
                enabled: false,
                format: "JPEG" as const,
                quality: 20,
                width: img.naturalWidth,
                height: img.naturalHeight,
              };
              // 圧縮が有効な場合は圧縮
              let finalFile = file;
              if (compressionSettings.enabled) {
                finalFile = await compressImageWithFFmpeg(
                  file,
                  compressionSettings
                );
              }
              resolve({
                id: crypto.randomUUID(),
                file: finalFile,
                preview: reader.result as string,
                compressionSettings,
              });
            };
            img.src = reader.result as string;
          };
          reader.readAsDataURL(file);
        });
      });

      // 画像ファイルをプレビューに追加
      Promise.all(promises).then((newPreviews) => {
        setImages((prev) => [...prev, ...newPreviews]);
      });
    }

    // 同じファイルを再選択できるようにinputの値をリセット
    e.target.value = "";
  };

  return (
    <div className="grid w-full items-center gap-4">
      <Input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="cursor-pointer upload-header"
        aria-label={t("fileInputLabel")}
      />
    </div>
  );
}
