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
import { Link } from "@/i18n/routing";
import { OAUTH_PROVIDERS } from "@/lib/constants";
import { loginSchema } from "@/lib/validation/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Chrome, Github } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";

export const LoginForm = ({
  isLoading,
  handleOAuthLogin,
  handleEmailLogin,
}: {
  isLoading: Record<string, boolean>;
  handleOAuthLogin: (
    provider: (typeof OAUTH_PROVIDERS)[number]
  ) => Promise<void>;
  handleEmailLogin: (data: z.infer<typeof loginSchema>) => void;
}) => {
  const t = useTranslations("Login");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <motion.h1
        className="text-3xl font-extrabold text-center text-white mb-8 tracking-tight drop-shadow-lg"
        variants={itemVariants}
      >
        {t("welcomeBack")}
      </motion.h1>

      <div className="max-w-sm mx-auto mt-10 flex flex-col gap-6">
        <div className="space-y-4">
          <motion.button
            className={`w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all duration-300 ${isLoading.google ? "opacity-70" : ""}`}
            onClick={() => handleOAuthLogin("google")}
            disabled={isLoading.google}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading.google ? (
              <span className="animate-spin mr-2">
                <Chrome className="w-4 h-4" />
              </span>
            ) : (
              <Chrome className="w-4 h-4 mr-2" />
            )}
            {t("continueWithGoogle")}
          </motion.button>

          <motion.button
            className={`w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all duration-300 ${isLoading.github ? "opacity-70" : ""}`}
            onClick={() => handleOAuthLogin("github")}
            disabled={isLoading.github}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading.github ? (
              <span className="animate-spin mr-2">
                <Github className="w-4 h-4" />
              </span>
            ) : (
              <Github className="w-4 h-4 mr-2" />
            )}
            {t("continueWithGitHub")}
          </motion.button>
        </div>

        <FormProvider {...form}>
          <form
            className="flex flex-col gap-5 mt-6"
            onSubmit={form.handleSubmit(handleEmailLogin)}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-semibold">
                    {t("email")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="example@example.com"
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
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-semibold">
                    {t("password")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="********"
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
              {form.formState.isSubmitting ? t("loading") : t("login")}
            </Button>
          </form>
        </FormProvider>
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button asChild variant="link" className="text-blue-400">
            <Link href="/signup">{t("toSignup")}</Link>
          </Button>
          <Button asChild variant="link" className="text-blue-400">
            <Link href="/sendEmail">{t("toSendEmail")}</Link>
          </Button>
        </div>
      </div>
    </>
  );
};
