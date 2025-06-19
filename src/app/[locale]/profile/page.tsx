"use client";

import TourGuid from "@/components/common/TourGuid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userProfilesApi } from "@/lib/api/user_profiles";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Step } from "react-joyride";
import { toast } from "sonner";

// ツアーステップは関数内でtを使って定義

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const {
    userProfiles,
    signOut,
    checkUser,
    userEmail,
    updateUserProfiles,
    isAuthenticated,
  } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    display_name: userProfiles?.display_name || "",
    bio: userProfiles?.bio || "",
    avatar_url: userProfiles?.avatar_url || "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      checkUser();
    }
  }, [checkUser, isAuthenticated]);

  useEffect(() => {
    if (userProfiles) {
      setFormData({
        display_name: userProfiles.display_name || "",
        bio: userProfiles.bio || "",
        avatar_url: userProfiles.avatar_url || "",
      });
    }
  }, [userProfiles]);

  if (!userProfiles) {
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
      // ユーザー情報を更新
      const updateResponse = await userProfilesApi.update({
        ...userProfiles,
        display_name: formData.display_name,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
      });

      // 型ガードでUserProfilesかどうかを確認
      if (updateResponse && "id" in updateResponse) {
        updateUserProfiles(updateResponse);
      }

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
        userImage={userProfiles.avatar_url || undefined}
        userName={userProfiles.display_name || ""}
      />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("profileTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar
                className="profile-avatar h-20 w-20"
                style={{ cursor: "pointer" }}
              >
                <AvatarImage src={userProfiles.avatar_url || undefined} />
                <AvatarFallback>
                  {userProfiles.display_name
                    ? userProfiles.display_name[0].toUpperCase()
                    : "No Names"}
                </AvatarFallback>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  aria-label="プロフィール画像をアップロード"
                />
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {userProfiles.display_name || t("noName")}
                </h2>
                <p className="text-gray-500">{userEmail || ""}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form space-y-4">
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
                className="update-button w-full mt-5"
              >
                {isUpdating ? t("updating") : t("updateProfile")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
