"use client";

import TourGuid from "@/components/common/TourGuid";
import { ImageList } from "@/components/ImageList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchBar } from "@/components/ui/searchBar";
import { useRouter } from "@/i18n/routing";
import { imagesApi } from "@/lib/api/images";
import { useAuthStore } from "@/store/useAuthStore";
import { components } from "@/types/api";
import { Image as ImageIcon, Loader2, User, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Step } from "react-joyride";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";

export function ImageGallery() {
  const { userId } = useAuthStore();
  const locale = useLocale();
  const t = useTranslations("ImageGallery");
  const router = useRouter();
  const [images, setImages] = useState<
    components["schemas"]["ImageWithTags"][]
  >([]); // 画像データの状態
  const [loading, setLoading] = useState(true); // ローディング状態
  const [searchQuery, setSearchQuery] = useState(""); // 検索クエリ
  const [viewMode, setViewMode] = useState<"personal" | "shared">("personal");

  // ツアーガイドのステップを定義
  const getTourSteps = (): Step[] => {
    const baseSteps: Step[] = [
      {
        target: ".search-bar",
        content: t("tour.searchBar"),
        placement: "bottom",
        disableBeacon: true,
        spotlightClicks: true,
      },
    ];

    if (images.length > 0) {
      return [
        ...baseSteps,
        {
          target: ".image-list > div:first-child",
          content: t("tour.imageList"),
          placement: "right",
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: ".image-list > div:first-child .aspect-video",
          content: t("tour.preview"),
          placement: "top",
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: ".image-list > div:first-child button:nth-child(1)",
          content: t("tour.edit"),
          placement: "bottom",
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: ".image-list > div:first-child button:nth-child(2)",
          content: t("tour.download"),
          placement: "bottom",
          disableBeacon: true,
          spotlightClicks: true,
        },
        {
          target: ".image-list > div:first-child button:nth-child(3)",
          content: t("tour.delete"),
          placement: "left",
          disableBeacon: true,
          spotlightClicks: true,
        },
      ];
    }
    return baseSteps;
  };

  // 画像データを取得する関数
  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await imagesApi.get_images({
        is_shared: viewMode === "shared",
        lang: locale,
      });
      if ("detail" in response) {
        throw new Error(response.detail?.[0]?.msg || t("error.fetchFailed"));
      }
      setImages(response as components["schemas"]["ImageWithTags"][]);
    } catch (error: unknown) {
      console.error("画像一覧の取得エラー:", error);
      toast.error(t("error.fetchFailed"), {
        description: t("error.tryAgain"),
      });
    } finally {
      setLoading(false);
    }
  }, [viewMode, userId, locale, t]);

  // コンポーネントがマウントされた時に画像データを取得
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const filteredImages = images.filter((image) => {
    return image.tags.some((tag: string) => tag.includes(searchQuery));
  });

  // 編集中の画像を設定する関数
  const handleEditImage = (image: components["schemas"]["ImageWithTags"]) => {
    router.push(
      `/editor?url=${encodeURIComponent(
        `https://${image.container_name}.blob.core.windows.net/${image.blob_name}`
      )}`
    );
  };

  // 画像をダウンロードする関数
  const handleDownload = async (
    image: components["schemas"]["ImageWithTags"]
  ) => {
    try {
      const blob = await imagesApi.get_image({
        blob_name: image.blob_name,
        is_shared: viewMode === "shared",
      });

      if (!(blob instanceof Blob)) {
        throw new Error(t("error.downloadFailed"));
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      console.error("ダウンロードエラー:", error);
      toast.error(t("error.downloadFailed"));
    }
  };

  // 画像を削除する関数
  const handleDelete = async (
    image: components["schemas"]["ImageWithTags"]
  ) => {
    try {
      const response = await imagesApi.delete(image.id);
      if ("detail" in response) {
        throw new Error(response.detail?.[0]?.msg || t("error.deleteFailed"));
      }
      await fetchImages();
      toast.success(t("success.delete"));
    } catch (error) {
      console.error("画像の削除エラー:", error);
      toast.error(t("error.deleteFailed"));
    }
  };

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <TourGuid steps={getTourSteps()} />
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4">
            <Tabs
              value={viewMode}
              onValueChange={(value) =>
                setViewMode(value as "personal" | "shared")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="personal"
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  {t("tabs.personal")}
                </TabsTrigger>
                <TabsTrigger value="shared" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("tabs.shared")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 検索フォーム */}
            <SearchBar
              query={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
          <ImageList
            images={filteredImages}
            onEditImage={handleEditImage}
            onDownload={handleDownload}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </>
  );
}
