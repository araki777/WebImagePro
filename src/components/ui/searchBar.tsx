import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

export function SearchBar({
  query,
  onChange,
  className,
}: {
  query: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  const t = useTranslations("SearchBar");
  return (
    <div className={`relative search-bar ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={t("placeholder")}
        value={query}
        onChange={onChange}
        className="pl-9"
      />
    </div>
  );
}
