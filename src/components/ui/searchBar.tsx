import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ISearchBarProps } from "@/types/types";

export function SearchBar({ query, onChange, className }: ISearchBarProps) {
  return (
    <div className={`relative search-bar ${className}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
        placeholder="画像を検索..."
        value={query}
        onChange={onChange}
        className="pl-9"
        />
    </div>
  )
}
