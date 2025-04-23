"use client";

import TourGuid from "@/components/common/TourGuid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { Link } from "@/i18n/routing";
import { useAuthStore } from "@/store/useAuthStore";
import { Image as ImageIcon, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Step } from "react-joyride";

// フッターをクライアントコンポーネントとして動的にインポート
const Footer = dynamic(() =>
  import("@/components/ui/footer").then((mod) => mod.Footer)
);

export default function Home() {
  const t = useTranslations("Home");
  const { user, isLoading, signOut, checkUser } = useAuthStore();

  // トップページのツアーステップを定義
  const steps: Step[] = [
    {
      target: ".card:nth-child(1)",
      content: t("tourUpload"),
      placement: "right",
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: ".card:nth-child(2)",
      content: t("tourGallery"),
      placement: "left",
      disableBeacon: true,
      spotlightClicks: true,
    },
  ];

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TourGuid steps={steps} />
      <Header
        onLogout={signOut}
        userImage={user.user_metadata.avatar_url}
        userName={user.user_metadata.full_name || user.email}
      />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-8 text-center">{t("title")}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t("uploadTitle")}
              </CardTitle>
              <CardDescription>{t("uploadDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{t("uploadContent")}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/upload">{t("uploadButton")}</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {t("galleryTitle")}
              </CardTitle>
              <CardDescription>{t("galleryDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{t("galleryContent")}</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/gallery">{t("galleryButton")}</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
