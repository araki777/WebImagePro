import { Toaster } from "@/components/ui/sonner";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Promise<any> | undefined;
}) {
  const resolvedParams = params ? await params : {};
  const locale = resolvedParams?.locale || "ja-JP";
  const messages = await getMessages({ locale });
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex flex-col min-h-screen">
        <Toaster richColors />
        <div className="flex-grow">{children}</div>
      </div>
    </NextIntlClientProvider>
  );
}
