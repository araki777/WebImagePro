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
import { sendEmailSchema } from "@/lib/validation/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

const SendEmailForm = () => {
  const t = useTranslations("Login");
  const tCommon = useTranslations("Common");
  const form = useForm<{ email: string }>({
    resolver: zodResolver(sendEmailSchema),
    defaultValues: {
      email: "",
    },
  });
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: { email: string }) => {
    const response = await authApi.sendEmail(data.email);
    console.log(response);
    setSent(true);
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
          className="text-3xl font-extrabold text-center text-white mb-8 tracking-tight drop-shadow-lg"
          variants={itemVariants}
        >
          {t("sendEmail")}
        </motion.h1>
        {sent ? (
          <div className="text-green-500 text-center font-semibold py-8">
            {t("sendEmailDone")}
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-semibold">
                      {t("email")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="example@example.com"
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
                  : tCommon("send")}
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

export default SendEmailForm;
