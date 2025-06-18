"use client";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useHashParams } from "@/hooks/useHashParams";
import { authApi } from "@/lib/api/auth";
import { resetPasswordSchema } from "@/lib/validation/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

const ResetPasswordForm = () => {
  const t = useTranslations("Login");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const form = useForm<{ password: string; confirmPassword: string }>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const [done, setDone] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const hashParams = useHashParams();

  useEffect(() => {
    // URLパラメータからtoken_hashを取得
    const accessToken = hashParams.get("access_token");
    setToken(accessToken);
  }, [hashParams]);

  const onSubmit = async (data: { password: string }) => {
    if (!token) {
      console.error("access_tokenが取得できません");
      return;
    }

    try {
      const response = await authApi.resetPassword({
        password: data.password,
        token: token,
      });

      // detailプロパティがない場合は成功
      if (!("detail" in response)) {
        setDone(true);
      } else {
        console.error("パスワードリセットエラー:", response.detail);
      }
    } catch (error) {
      console.error("パスワードリセットエラー:", error);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative max-w-sm mx-auto mt-10 flex flex-col gap-6">
      <button
        type="button"
        className="absolute left-4 top-4 flex items-center gap-1 text-white hover:text-blue-400 transition z-10"
        onClick={() => router.push("/login")}
        aria-label="戻る"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">{tCommon("back")}</span>
      </button>
      <div className="pt-12">
        <motion.h1
          className="text-3xl font-extrabold text-center text-white mb-8 tracking-tight drop-shadow-lg"
          variants={itemVariants}
        >
          {t("resetPassword")}
        </motion.h1>
        {done ? (
          <div className="text-green-500 text-center font-semibold py-8">
            {t("resetPasswordDone")}
            <Button
              className="mt-6 px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold shadow"
              onClick={() => router.push("/")}
            >
              {tCommon("goHome")}
            </Button>
          </div>
        ) : (
          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-semibold">
                      {t("newPassword")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="新しいパスワードを入力"
                        className="bg-white/80 focus:bg-white text-black placeholder-gray-400 border border-white/30 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 transition"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-sm mt-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-semibold">
                      {t("newPasswordConfirm")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="パスワードを再入力"
                        className="bg-white/80 focus:bg-white text-black placeholder-gray-400 border border-white/30 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 transition"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400 text-sm mt-1" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg shadow-md hover:from-blue-600 hover:to-indigo-600 transition"
              >
                {form.formState.isSubmitting
                  ? tCommon("sending")
                  : t("resetPassword")}
              </Button>
              {form.formState.errors.root && (
                <div className="text-red-500 mt-2 text-center font-semibold">
                  {form.formState.errors.root.message}
                </div>
              )}
            </form>
          </FormProvider>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordForm;
