"use client";

import TourGuid from "@/components/common/TourGuid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Step } from "react-joyride";
import { toast } from "sonner";

// ツアーステップは関数内でtを使って定義

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const { user, isLoading, signOut, setUser, checkUser } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata.full_name || "",
    display_name: user?.user_metadata.display_name || "",
    bio: user?.user_metadata.bio || "",
  });

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (isLoading || !user) {
    return null;
  }

  const steps: Step[] = [
    {
      target: ".profile-avatar",
      content: t("tourAvatar"),
      placement: "right",
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: ".profile-form",
      content: t("tourForm"),
      placement: "bottom",
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: ".update-button",
      content: t("tourUpdate"),
      placement: "top",
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: ".user-info",
      content: t("tourUserInfo"),
      placement: "top",
      disableBeacon: true,
      spotlightClicks: true,
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // APIを使用してユーザープロフィールデータを更新
      await api.update("user_profiles", user.id, {
        full_name: formData.full_name,
        display_name: formData.display_name,
        bio: formData.bio,
      });

      // Auth情報も更新
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          display_name: formData.display_name,
          bio: formData.bio,
        },
      });

      if (error) throw error;

      // ユーザー情報を更新
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...formData,
        },
      });

      toast.success(t("updateSuccess"));
    } catch (error) {
      console.error("プロフィール更新エラー:", error);
      toast.error(error instanceof Error ? error.message : t("updateError"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TourGuid steps={steps} />
      <Header
        onLogout={signOut}
        userImage={user.user_metadata.avatar_url}
        userName={user.user_metadata.full_name || user.email}
      />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("profileTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="profile-avatar h-20 w-20">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {user.user_metadata.full_name || t("noName")}
                </h2>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">{t("fullName")}</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder={t("fullNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">{t("displayName")}</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  placeholder={t("displayNamePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t("bio")}</Label>
                <Input
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder={t("bioPlaceholder")}
                />
              </div>

              <Button
                type="submit"
                disabled={isUpdating}
                className="update-button"
              >
                {isUpdating ? t("updating") : t("updateProfile")}
              </Button>
            </form>

            <div className="user-info space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{t("userId")}</h3>
                <p className="text-gray-600">{user.id}</p>
              </div>
              {user.user_metadata.provider && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t("loginMethod")}</h3>
                  <p className="text-gray-600">{user.user_metadata.provider}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
