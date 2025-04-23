import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

// フッターをクライアントコンポーネントとして動的にインポート
const ClientFooter = dynamic(() =>
  import("@/components/ui/footer").then((mod) => mod.Footer)
);

export default function TermsPage() {
  const t = useTranslations("Terms");
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
            <h2 className="text-2xl font-semibold">{t("serviceTitle")}</h2>
            <p>{t("serviceText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("accountTitle")}</h2>
            <p>{t("accountText")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("accountList1")}</li>
              <li>{t("accountList2")}</li>
              <li>{t("accountList3")}</li>
              <li>{t("accountList4")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("restrictionTitle")}</h2>
            <p>{t("restrictionText")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("restrictionList1")}</li>
              <li>{t("restrictionList2")}</li>
              <li>{t("restrictionList3")}</li>
              <li>{t("restrictionList4")}</li>
              <li>{t("restrictionList5")}</li>
              <li>{t("restrictionList6")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("ipTitle")}</h2>
            <p>{t("ipText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("disclaimerTitle")}</h2>
            <p>{t("disclaimerText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("liabilityTitle")}</h2>
            <p>{t("liabilityText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("changeTitle")}</h2>
            <p>{t("changeText")}</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">{t("lawTitle")}</h2>
            <p>{t("lawText")}</p>
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
