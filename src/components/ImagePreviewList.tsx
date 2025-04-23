import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatFileSize } from "@/lib/utils";
import { IImagePreviewListProps } from "@/types/types";
import { Calendar, FileType, HardDrive, Pencil, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export function ImagePreviewList({ images, onRemove }: IImagePreviewListProps) {
  const t = useTranslations("ImagePreviewList");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {images.map((image, index) => (
        <Card key={index} className="relative group overflow-hidden">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border flex-shrink-0">
                <Image
                  src={image.preview}
                  alt={t("previewAlt", { index: index + 1 })}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate mb-2">
                  {image.file.name}
                </div>
                <dl className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileType className="h-4 w-4" />
                    <dt className="sr-only">{t("fileType")}</dt>
                    <dd>{image.file.type}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="h-4 w-4" />
                    <dt className="sr-only">{t("fileSize")}</dt>
                    <dd>{formatFileSize(image.file.size)}</dd>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <dt className="sr-only">{t("lastModified")}</dt>
                    <dd>{formatDate(new Date(image.file.lastModified))}</dd>
                  </div>
                </dl>
                <Button variant="outline" size="sm" className="mt-2">
                  <Pencil className="h-4 w-4 mr-2" />
                  {t("edit")}
                </Button>
              </div>
            </div>
          </CardContent>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title={t("delete")}
          >
            <X className="h-4 w-4" />
          </button>
        </Card>
      ))}
    </div>
  );
}
