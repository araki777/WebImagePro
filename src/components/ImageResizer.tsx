import React from 'react'
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { IImageResizerProps } from '@/types/types';
import { Tabs, TabsContent } from '@/components/ui/tabs';

export const ImageResizer = ({ resizeWidth, resizeHeight, onWidthChange, onHeightChange, onAspectRatioChange, maintainAspectRatio }: IImageResizerProps) => {

  return (
    <Tabs defaultValue="basic" className="space-y-3">
      <TabsContent value="basic" className="space-y-3">
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-8 text-xs"
            onClick={() => onAspectRatioChange()}
          >
            {maintainAspectRatio ? (
              <Lock className="w-4 h-4 mr-2" />
            ) : (
              <Unlock className="w-4 h-4 mr-2" />
            )}
            アスペクト比を{maintainAspectRatio ? 'ロック' : 'アンロック'}
          </Button>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">幅</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[resizeWidth]}
                  onValueChange={([value]) => onWidthChange(value)}
                  min={10}
                  max={1000}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs tabular-nums">
                  {resizeWidth}px
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">高さ</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[resizeHeight]}
                  onValueChange={([value]) => onHeightChange(value)}
                  min={10}
                  max={1000}
                  step={1}
                  className="flex-1"
                  disabled={maintainAspectRatio}
                />
                <span className="text-xs tabular-nums">
                  {resizeHeight}px
                </span>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
