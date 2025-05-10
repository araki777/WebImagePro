import { Input } from "@/components/ui/input";
import { IImagePreview, IImageUploadFormProps } from "@/types/types";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function ImageUploadForm({ setImages }: IImageUploadFormProps) {
  const t = useTranslations("ImageUploadForm");
  // 画像ファイルが変更されたときの処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        return new Promise<IImagePreview>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              id: crypto.randomUUID(),
              file,
              preview: reader.result as string,
            });
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
