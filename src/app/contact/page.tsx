'use client';

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { IContactForm } from "@/types/types";
import { api } from "@/lib/api";

export default function ContactPage() {
  const { user, isLoading, checkUser } = useAuthStore();
  const [formData, setFormData] = useState<IContactForm>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ページロード時に認証状態を確認
  useEffect(() => {
    checkUser();
  }, [checkUser]);

  // ユーザー情報が変更されたときにフォームデータを更新
  useEffect(() => {
    // ユーザー情報のロードが完了し、ユーザーが存在する場合
    if (!isLoading && user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || "",
        email: user.email || ""
      }));
    }
  }, [user, isLoading]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // ログインユーザーの場合、nameとemailフィールドは変更不可
    if (user && (name === 'name' || name === 'email')) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // APIを使用してお問い合わせデータを保存
      await api.create('contacts', {
        user_id: user?.id || null, // ユーザーがログインしている場合はuser_idを紐づける（API側でも設定されます）
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        status: 'pending'
      });

      // トースト通知を表示
      toast.success("お問い合わせを受け付けました。担当者より連絡いたします。", {
        duration: 5000,
      });
      
      // フォームをリセット（ログインユーザーの場合は名前とメールはそのまま）
      setFormData({
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
        email: user?.email || "",
        subject: "",
        message: ""
      });
    } catch (error) {
      console.error('お問い合わせ送信エラー:', error);
      toast.error(error instanceof Error ? error.message : "お問い合わせの送信に失敗しました。時間をおいて再度お試しください。", {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <div className="space-y-10 pb-6 pt-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">お問い合わせ</h1>
          <p className="text-gray-500">
            WebImageProに関するご質問やご意見をお聞かせください。
          </p>
        </div>
        <Separator />
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-pulse text-center">
              <p className="text-gray-500">ユーザー情報を読み込み中...</p>
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
                        <p className="text-sm font-medium text-gray-700">お名前</p>
                        <p className="text-sm">{formData.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">メールアドレス</p>
                        <p className="text-sm">{formData.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">ログイン情報から自動入力されています</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">お名前</Label>
                      <Input 
                        id="name"
                        name="name"
                        placeholder="山田 太郎" 
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">メールアドレス</Label>
                      <Input 
                        id="email"
                        name="email"
                        type="email"
                        placeholder="example@example.com" 
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="subject">件名</Label>
                  <Input 
                    id="subject"
                    name="subject"
                    placeholder="お問い合わせの件名" 
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="text-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">メッセージ</Label>
                  <Textarea 
                    id="message"
                    name="message"
                    placeholder="お問い合わせ内容を入力してください" 
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={10}
                    className="min-h-[200px] text-base"
                  />
                </div>
                
                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  送信する
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
} 