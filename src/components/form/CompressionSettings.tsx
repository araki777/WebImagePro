import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ICompressionSettingsProps } from "@/types/types";
import { Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function CompressionSettings({
  compressionSettings,
  setCompressionSettings,
}: ICompressionSettingsProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const t = useTranslations("CompressionSettings");

  return (
    <Collapsible
      open={isSettingsOpen}
      onOpenChange={setIsSettingsOpen}
      className="border rounded-lg p-4 compression-settings"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings2 className="h-4 w-4" />
          <h4 className="text-sm font-semibold">{t("title")}</h4>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm">
            {isSettingsOpen ? t("close") : t("open")}
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* 圧縮設定の内容 */}
      <CollapsibleContent className="space-y-4 mt-4">
        {/* 圧縮設定の切り替え */}
        <div className="flex items-center space-x-2">
          <Switch
            id="compression-toggle"
            checked={compressionSettings.enabled}
            onCheckedChange={(checked) =>
              setCompressionSettings((prev) => ({
                ...prev,
                enabled: checked,
              }))
            }
          />
          <Label htmlFor="compression-toggle">{t("enable")}</Label>
        </div>

        {/* 画質、最大幅、高さの設定 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              {t("quality", { value: compressionSettings.quality })}
            </Label>
            <Slider
              disabled={!compressionSettings.enabled}
              value={[compressionSettings.quality]}
              onValueChange={([value]) =>
                setCompressionSettings((prev) => ({ ...prev, quality: value }))
              }
              min={1}
              max={100}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t("maxWidth", { value: compressionSettings.maxWidth })}
            </Label>
            <Slider
              disabled={!compressionSettings.enabled}
              value={[compressionSettings.maxWidth]}
              onValueChange={([value]) =>
                setCompressionSettings({
                  ...compressionSettings,
                  maxWidth: value,
                })
              }
              min={100}
              max={3840}
              step={100}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {t("maxHeight", { value: compressionSettings.maxHeight })}
            </Label>
            <Slider
              disabled={!compressionSettings.enabled}
              value={[compressionSettings.maxHeight]}
              onValueChange={([value]) =>
                setCompressionSettings({
                  ...compressionSettings,
                  maxHeight: value,
                })
              }
              min={100}
              max={2160}
              step={100}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
