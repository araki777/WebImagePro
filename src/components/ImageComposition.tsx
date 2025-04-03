import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon, Stamp } from "lucide-react";
import { useState } from "react";
import { IImageCompositionProps } from "@/types/types"
import { Input } from "@/components/ui/input";

export function ImageComposition({
  onMakeTransparent,
  onAddWatermark,
  onComposite,
  onAddStamp,
  isSave,
}: IImageCompositionProps) {
  const [activeTab, setActiveTab] = useState("transparent");
  const [threshold, setThreshold] = useState(128);
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null);
  const [watermarkX, setWatermarkX] = useState(0);
  const [watermarkY, setWatermarkY] = useState(0);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5);
  const [overlayFile, setOverlayFile] = useState<File | null>(null);
  const [overlayX, setOverlayX] = useState(0);
  const [overlayY, setOverlayY] = useState(0);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [stampX, setStampX] = useState(0);
  const [stampY, setStampY] = useState(0);

  const handleWatermarkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setWatermarkFile(e.target.files[0]);
    }
  };

  const handleOverlayFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setOverlayFile(e.target.files[0]);
    }
  };

  const handleStampFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStampFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full flex justify-between gap-1 px-1">
          <TabsTrigger value="transparent" className="flex-1 min-w-0 px-2 text-xs py-1">
            <ImageIcon className="w-3 h-3 mr-1" />
            透過
          </TabsTrigger>
          <TabsTrigger value="watermark" className="flex-1 min-w-0 px-2 text-xs py-1">
            <Upload className="w-3 h-3 mr-1" />
            ウォーターマーク
          </TabsTrigger>
          <TabsTrigger value="composite" className="flex-1 min-w-0 px-2 text-xs py-1">
            <ImageIcon className="w-3 h-3 mr-1" />
            合成
          </TabsTrigger>
          <TabsTrigger value="stamp" className="flex-1 min-w-0 px-2 text-xs py-1">
            <Stamp className="w-3 h-3 mr-1" />
            スタンプ
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto mt-1 px-4">
          <TabsContent value="transparent" className="space-y-2">
            <div className="space-y-1">
              <Label className="text-xs">透過度の閾値</Label>
              <Slider
                value={[threshold]}
                onValueChange={(value) => setThreshold(value[0])}
                min={0}
                max={255}
                step={1}
              />
              <div className="text-xs text-muted-foreground">
                閾値: {threshold}
              </div>
            </div>
            <Button
              className="w-full h-7 text-xs"
              onClick={() => onMakeTransparent(threshold)}
              disabled={isSave}
            >
              {isSave ? "処理中..." : "透過処理を実行"}
            </Button>
          </TabsContent>

          <TabsContent value="watermark" className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">ウォーターマーク画像</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="watermark-file"
                  type="file"
                  accept="image/*"
                  onChange={handleWatermarkFileChange}
                  className="hidden"
                  title="ウォーターマーク画像を選択"
                />
                <Button
                  variant="outline"
                  className="h-7 text-xs flex-1"
                  onClick={() => document.getElementById('watermark-file')?.click()}
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {watermarkFile ? watermarkFile.name : "画像を選択"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">X座標</Label>
                <Slider
                  value={[watermarkX]}
                  onValueChange={(value) => setWatermarkX(value[0])}
                  min={0}
                  max={1000}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">
                  X: {watermarkX}px
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y座標</Label>
                <Slider
                  value={[watermarkY]}
                  onValueChange={(value) => setWatermarkY(value[0])}
                  min={0}
                  max={1000}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">
                  Y: {watermarkY}px
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">透明度</Label>
              <Slider
                value={[watermarkOpacity]}
                onValueChange={(value) => setWatermarkOpacity(value[0])}
                min={0}
                max={1}
                step={0.1}
              />
              <div className="text-xs text-muted-foreground">
                透明度: {Math.round(watermarkOpacity * 100)}%
              </div>
            </div>
            <Button
              className="w-full h-7 text-xs"
              onClick={() => watermarkFile && onAddWatermark(watermarkFile, watermarkX, watermarkY, watermarkOpacity)}
              disabled={isSave || !watermarkFile}
            >
              {isSave ? "処理中..." : "ウォーターマークを追加"}
            </Button>
          </TabsContent>

          <TabsContent value="composite" className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">合成する画像</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="overlay-file"
                  type="file"
                  accept="image/*"
                  onChange={handleOverlayFileChange}
                  className="hidden"
                  title="合成する画像を選択"
                />
                <Button
                  variant="outline"
                  className="h-7 text-xs flex-1"
                  onClick={() => document.getElementById('overlay-file')?.click()}
                >
                  <ImageIcon className="w-3 h-3 mr-1" />
                  {overlayFile ? overlayFile.name : "画像を選択"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">X座標</Label>
                <Slider
                  value={[overlayX]}
                  onValueChange={(value) => setOverlayX(value[0])}
                  min={0}
                  max={1000}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">
                  X: {overlayX}px
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y座標</Label>
                <Slider
                  value={[overlayY]}
                  onValueChange={(value) => setOverlayY(value[0])}
                  min={0}
                  max={1000}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">
                  Y: {overlayY}px
                </div>
              </div>
            </div>
            <Button
              className="w-full h-7 text-xs"
              onClick={() => overlayFile && onComposite(overlayFile, overlayX, overlayY)}
              disabled={isSave || !overlayFile}
            >
              {isSave ? "処理中..." : "画像を合成"}
            </Button>
          </TabsContent>

          <TabsContent value="stamp" className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">スタンプ画像</Label>
              <div className="flex items-center gap-1">
                <Input
                  id="stamp-file"
                  type="file"
                  accept="image/*"
                  onChange={handleStampFileChange}
                  className="hidden"
                  title="スタンプ画像を選択"
                />
                <Button
                  variant="outline"
                  className="h-7 text-xs flex-1"
                  onClick={() => document.getElementById('stamp-file')?.click()}
                >
                  <Stamp className="w-3 h-3 mr-1" />
                  {stampFile ? stampFile.name : "画像を選択"}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">X座標</Label>
                <Slider
                  value={[stampX]}
                  onValueChange={(value) => setStampX(value[0])}
                  min={0}
                  max={1000}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">
                  X: {stampX}px
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Y座標</Label>
                <Slider
                  value={[stampY]}
                  onValueChange={(value) => setStampY(value[0])}
                  min={0}
                  max={1000}
                  step={1}
                />
                <div className="text-xs text-muted-foreground">
                  Y: {stampY}px
                </div>
              </div>
            </div>
            <Button
              className="w-full h-7 text-xs"
              onClick={() => stampFile && onAddStamp(stampFile, stampX, stampY)}
              disabled={isSave || !stampFile}
            >
              {isSave ? "処理中..." : "スタンプを追加"}
            </Button>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}