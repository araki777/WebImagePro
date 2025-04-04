import { Button } from "@/components/ui/button";
import { IImageUploadActionsProps } from "@/types/types";
import { Upload } from "lucide-react";
import { toast } from 'sonner';

export function ImageUploadActions({ images, setImages }: IImageUploadActionsProps) {
      // 画像をアップロードする関数
  const handleUpload = async () => {
    if (images.length === 0) return;

    // 画像ごとにアップロード処理を行う
    const uploadPromises = images.map(async (image) => {
      const formData = new FormData();
      formData.append('file', image.file);

      try {
        // APIへ画像ファイルをPOSTリクエストで送信
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('アップロードに失敗しました');
        }

        // レスポンスからURLを取得
        const data = await response.json();
        return data.url;
      } catch (error) {
        throw error;
      }
    });

    // 複数の画像アップロードの状態管理
    toast.promise(Promise.all(uploadPromises), {
      loading: '画像をアップロード中...',
      success: () => {
        setImages([]); // アップロード完了後は画像をクリア
        return `${images.length}枚の画像をアップロードしました`;
      },
      error: 'アップロードに失敗しました'
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Button onClick={handleUpload} disabled={images.length === 0} className="flex-1 upload-button">
        <Upload className="mr-2 h-4 w-4" />
        {images.length > 0 ? `${images.length}枚の画像をアップロード` : 'アップロード'}
      </Button>
    </div>
  );
}
