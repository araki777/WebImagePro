"use client";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { IContactForm } from "@/types/types";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// フッターをクライアントコンポーネントとして動的にインポート
const Footer = dynamic(() =>
  import("@/components/ui/footer").then((mod) => mod.Footer)
);

export default function ContactPage() {
  const t = useTranslations("Contact");
  const { user, checkUser } = useAuthStore();
  const [formData, setFormData] = useState<IContactForm>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ページロード時に認証状態を確認
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // ユーザー情報が変更されたときにフォームデータを更新
  useEffect(() => {
    // ユーザー情報のロードが完了し、ユーザーが存在する場合
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // ログインユーザーの場合、nameとemailフィールドは変更不可
    if (user && (name === "name" || name === "email")) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // APIを使用してお問い合わせデータを保存
      await api.create("contacts", {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      // メール送信
      await api.send({
        to: process.env.NEXT_PUBLIC_RESEND_EMAIL_TO || "",
        subject: formData.subject,
        message: formData.message,
        from: process.env.NEXT_PUBLIC_RESEND_EMAIL_FROM || "",
        name: formData.name,
        email: formData.email,
      });

      // トースト通知を表示
      toast.success(t("success"), {
        duration: 5000,
      });

      // フォームをリセット（ログインユーザーの場合は名前とメールはそのまま）
      setFormData({
        name:
          user?.user_metadata?.full_name || user?.email?.split("@")[0] || "",
        email: user?.email || "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("お問い合わせ送信エラー:", error);
      toast.error(error instanceof Error ? error.message : t("error"), {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Container>
        <div className="space-y-10 pb-6 pt-6 flex-grow">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-gray-500">{t("description")}</p>
          </div>
          <Separator />

          {!user ? (
            <div className="flex justify-center py-10">
              <div className="animate-pulse text-center">
                <p className="text-gray-500">{t("loadingUser")}</p>
              </div>
            </div>
          ) : (
            <div className={user ? "max-w-2xl mx-auto" : "max-w-md mx-auto"}>
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {user ? (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div className="mb-2 sm:mb-0">
                          <p className="text-sm font-medium text-gray-700">
                            {t("name")}
                          </p>
                          <p className="text-sm">{formData.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {t("email")}
                          </p>
                          <p className="text-sm">{formData.email}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {t("autoFilled")}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="name">{t("name")}</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder={t("namePlaceholder")}
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">{t("email")}</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder={t("emailPlaceholder")}
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="subject">{t("subject")}</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder={t("subjectPlaceholder")}
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="text-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t("message")}</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder={t("messagePlaceholder")}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={10}
                      className="min-h-[200px] text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("submitting") : t("submit")}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </Container>
      <Footer />
    </div>
  );
}
