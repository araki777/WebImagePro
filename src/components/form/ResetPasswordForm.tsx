import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/auth";
import { resetPasswordSchema } from "@/lib/validation/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

  const onSubmit = async (data: { password: string }) => {
    const response = await authApi.resetPassword(data.password);
    console.log(response);
    setDone(true);
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
        onClick={() => router.back()}
        aria-label="戻る"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">{tCommon("back")}</span>
      </button>
      <div className="pt-12">
        <motion.h1
          className="text-2xl font-bold text-center text-white mb-6"
          variants={itemVariants}
        >
          {t("resetPassword")}
        </motion.h1>
        <h2 className="text-xl font-bold mb-4">{t("resetPassword")}</h2>
        {done ? (
          <div className="text-green-600 text-center font-semibold py-8">
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("newPassword")}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("newPasswordConfirm")}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {t("resetPassword")}
              </Button>
            </form>
          </FormProvider>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordForm;
