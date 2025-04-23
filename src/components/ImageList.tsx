// ImageList.tsx
import { Button } from "@/components/ui/button";
import { cn, formatFileSize } from "@/lib/utils";
import { IImageListProps } from "@/types/types";
import { Download, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function ImageList({
  images,
  onEditImage,
  onDownload,
  onDelete,
  className,
}: IImageListProps) {
  const t = useTranslations("ImageList");
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-4 image-list",
        className
      )}
    >
      {images.map((image, index) => (
        <div key={image.url} className="overflow-hidden">
          <div className="p-4">
            <div className="aspect-video relative rounded-lg overflow-hidden mb-4">
              <Image
                src={image.url}
                alt={t("previewAlt", { index: index + 1, name: image.name })}
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
                  {t("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(image)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t("download")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(image)}
                  title={t("delete")}
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
