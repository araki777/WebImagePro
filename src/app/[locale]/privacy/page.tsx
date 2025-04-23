import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

// フッターをクライアントコンポーネントとして動的にインポート
const ClientFooter = dynamic(() =>
  import("@/components/ui/footer").then((mod) => mod.Footer)
);

export default function PrivacyPolicyPage() {
  const t = useTranslations("Privacy");
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Container>
        <div className="space-y-6 py-10 max-w-3xl mx-auto flex-grow">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <Separator />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("introTitle")}</h2>
            <p>{t("introText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("collectTitle")}</h2>
            <p>{t("collectText")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("collectList1")}</li>
              <li>{t("collectList2")}</li>
              <li>{t("collectList3")}</li>
              <li>{t("collectList4")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("purposeTitle")}</h2>
            <p>{t("purposeText")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("purposeList1")}</li>
              <li>{t("purposeList2")}</li>
              <li>{t("purposeList3")}</li>
              <li>{t("purposeList4")}</li>
              <li>{t("purposeList5")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("shareTitle")}</h2>
            <p>{t("shareText")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("shareList1")}</li>
              <li>{t("shareList2")}</li>
              <li>{t("shareList3")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("protectTitle")}</h2>
            <p>{t("protectText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("cookieTitle")}</h2>
            <p>{t("cookieText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("rightsTitle")}</h2>
            <p>{t("rightsText")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("rightsList1")}</li>
              <li>{t("rightsList2")}</li>
              <li>{t("rightsList3")}</li>
              <li>{t("rightsList4")}</li>
            </ul>
            <p>{t("rightsContact")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("childrenTitle")}</h2>
            <p>{t("childrenText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("changeTitle")}</h2>
            <p>{t("changeText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("contactTitle")}</h2>
            <p>{t("contactText")}</p>
          </section>

          <div className="text-sm text-muted-foreground pt-4">
            {t("lastUpdated")}
          </div>
        </div>
      </Container>
      <ClientFooter />
    </div>
  );
}
