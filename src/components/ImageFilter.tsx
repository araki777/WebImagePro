import { IImageFilterProps } from "@/types/types";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplet, Scissors, Palette, MoreHorizontal } from "lucide-react";

export function ImageFilter({
  gaussianBlur,
  motionBlur,
  sharpen,
  edgeDetection,
  noiseReduction,
  vignette,
  hdr,
  mosaic,
  oilPainting,
  setGaussianBlur,
  setMotionBlur,
  setSharpen,
  setEdgeDetection,
  setNoiseReduction,
  setVignette,
  setHdr,
  setMosaic,
  setOilPainting,
  onGaussianBlurChange,
  onMotionBlurChange,
  onSharpenChange,
  onEdgeDetectionChange,
  onNoiseReductionChange,
  onVignetteChange,
  onHdrChange,
  onMosaicChange,
  onOilPaintingChange,
}: IImageFilterProps) {
  return (
    <Tabs defaultValue="blur" className="w-full">
      <TabsList className="w-full flex justify-between gap-1 px-1">
        <TabsTrigger value="blur" className="flex-1 min-w-0 px-2 text-xs py-1">
          <Droplet className="w-3 h-3 mr-1" />
          ぼかし
        </TabsTrigger>
        <TabsTrigger value="sharp" className="flex-1 min-w-0 px-2 text-xs py-1">
          <Scissors className="w-3 h-3 mr-1" />
          シャープ
        </TabsTrigger>
        <TabsTrigger value="artistic" className="flex-1 min-w-0 px-2 text-xs py-1">
          <Palette className="w-3 h-3 mr-1" />
          アーティスティック
        </TabsTrigger>
        <TabsTrigger value="other" className="flex-1 min-w-0 px-2 text-xs py-1">
          <MoreHorizontal className="w-3 h-3 mr-1" />
          その他
        </TabsTrigger>
      </TabsList>

      <div className="mt-4">
        <TabsContent value="blur" className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-medium">ガウシアンボカシ</Label>
            <Slider
              min={0}
              max={10}
              step={0.1}
              value={[gaussianBlur]}
              onValueChange={(value) => {
                setGaussianBlur(value[0]);
                onGaussianBlurChange(value[0]);
              }}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium">モーションボカシ</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-2">角度</Label>
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={[motionBlur.angle]}
                  onValueChange={(value) => {
                    setMotionBlur({ ...motionBlur, angle: value[0] });
                    onMotionBlurChange(value[0], motionBlur.distance);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2">距離</Label>
                <Slider
                  min={0}
                  max={20}
                  step={1}
                  value={[motionBlur.distance]}
                  onValueChange={(value) => {
                    setMotionBlur({ ...motionBlur, distance: value[0] });
                    onMotionBlurChange(motionBlur.angle, value[0]);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium">ノイズ除去</Label>
            <Slider
              min={0}
              max={5}
              step={1}
              value={[noiseReduction]}
              onValueChange={(value) => {
                setNoiseReduction(value[0]);
                onNoiseReductionChange(value[0]);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="sharp" className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-medium">シャープ化</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-2">強さ</Label>
                <Slider
                  min={0}
                  max={5}
                  step={0.1}
                  value={[sharpen.sigma]}
                  onValueChange={(value) => {
                    setSharpen({ ...sharpen, sigma: value[0] });
                    onSharpenChange(value[0], sharpen.threshold);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2">閾値</Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[sharpen.threshold]}
                  onValueChange={(value) => {
                    setSharpen({ ...sharpen, threshold: value[0] });
                    onSharpenChange(sharpen.sigma, value[0]);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium">エッジ検出</Label>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[edgeDetection]}
              onValueChange={(value) => {
                setEdgeDetection(value[0]);
                onEdgeDetectionChange(value[0]);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="artistic" className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-medium">油彩効果</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground mb-2">半径</Label>
                <Slider
                  min={0}
                  max={5}
                  step={1}
                  value={[oilPainting.radius]}
                  onValueChange={(value) => {
                    setOilPainting({ ...oilPainting, radius: value[0] });
                    onOilPaintingChange(value[0], oilPainting.intensity);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2">強さ</Label>
                <Slider
                  min={0}
                  max={255}
                  step={1}
                  value={[oilPainting.intensity]}
                  onValueChange={(value) => {
                    setOilPainting({ ...oilPainting, intensity: value[0] });
                    onOilPaintingChange(oilPainting.radius, value[0]);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium">モザイク</Label>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[mosaic]}
              onValueChange={(value) => {
                setMosaic(value[0]);
                onMosaicChange(value[0]);
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="other" className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-medium">HDR</Label>
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={[hdr]}
              onValueChange={(value) => {
                setHdr(value[0]);
                onHdrChange(value[0]);
              }}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-medium">ビネット</Label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[vignette]}
              onValueChange={(value) => {
                setVignette(value[0]);
                onVignetteChange(value[0]);
              }}
            />
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
