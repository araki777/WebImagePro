import { OAUTH_PROVIDERS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Chrome, Github } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

const LoginPanel: React.FC = () => {
  const t = useTranslations("Login");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    github: false,
  });

  const handleOAuthLogin = async (
    provider: (typeof OAUTH_PROVIDERS)[number]
  ) => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }));

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        console.error("OAuth login error:", error);
        setIsLoading((prev) => ({ ...prev, [provider]: false }));
      }
    } catch (error) {
      console.error("OAuth login error:", error);
      setIsLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="p-6 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 w-full max-w-sm pointer-events-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        className="text-2xl font-bold text-center text-white mb-6"
        variants={itemVariants}
      >
        {t("welcomeBack")}
      </motion.h1>

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
    </motion.div>
  );
};

export default LoginPanel;
