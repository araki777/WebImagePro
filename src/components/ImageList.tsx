// ImageList.tsx
import { Button } from "@/components/ui/button";
import { Pencil, Download, Trash2 } from "lucide-react";
import { formatFileSize } from "@/lib/utils";
import Image from "next/image";
import { ImageListProps } from "@/types/types";

export function ImageList({ images, onEditImage, onDownload, onDelete }: ImageListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {images.map((image) => (
        <div key={image.url} className="overflow-hidden">
          <div className="p-4">
            <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
              <Image
                src={image.url}
                alt={image.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <div className="font-medium truncate">{image.name}</div>
              <div className="text-sm text-muted-foreground">
                {formatFileSize(image.size)}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditImage(image)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  編集
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(image)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  ダウンロード
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(image)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
