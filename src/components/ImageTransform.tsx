import { Button } from "@/components/ui/button";
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical } from "lucide-react";
import { ImageTransformProps } from "@/types/types";
import { Tabs, TabsContent } from "@/components/ui/tabs";

export function ImageTransform({ onRotate, onFlip, isSave }: ImageTransformProps) {
  return (
    <Tabs defaultValue="basic" className="space-y-3">
      <TabsContent value="basic" className="space-y-3">
        <div className="text-xs text-muted-foreground mb-2">
          画像を回転または反転させることができます
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => onRotate(90)}
              disabled={isSave}
            >
              <RotateCw className="w-4 h-4 mr-2" />
              90°時計回り
            </Button>
            <Button
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => onRotate(270)}
              disabled={isSave}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              90°反時計回り
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full h-8 text-xs"
            onClick={() => onRotate(180)}
            disabled={isSave}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            180°回転
          </Button>

          <div className="grid grid-cols-2 gap-1.5">
            <Button
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => onFlip(true)}
              disabled={isSave}
            >
              <FlipHorizontal className="w-4 h-4 mr-2" />
              水平反転
            </Button>
            <Button
              variant="outline"
              className="w-full h-8 text-xs"
              onClick={() => onFlip(false)}
              disabled={isSave}
            >
              <FlipVertical className="w-4 h-4 mr-2" />
              垂直反転
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}