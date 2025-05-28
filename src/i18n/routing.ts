import { DEFAULT_LANGUAGE, LANGUAGES } from "@/lib/constants";
import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  defaultLocale: DEFAULT_LANGUAGE,
  locales: LANGUAGES,
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
