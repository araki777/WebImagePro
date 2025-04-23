"use client";

import { Link } from "@/i18n/routing";
import { Github, InstagramIcon, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");
  // 現在の年を静的に設定（サーバー側とクライアント側で一致するように）
  const currentYear = new Date().getFullYear().toString();

  return (
    <footer className="border-t py-6 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-bold">WebImagePro</h3>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
            <div className="flex space-x-4">
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <Github size={20} />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary"
              >
                <InstagramIcon size={20} />
                <span className="sr-only">Instagram</span>
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold">{t("productTitle")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/upload"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {t("upload")}
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {t("gallery")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold">{t("accountTitle")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/profile"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {t("profile")}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {t("settings")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold">{t("legalTitle")}</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  {t("contact")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          <p>{t("copyright", { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
}
