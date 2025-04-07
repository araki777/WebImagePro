import React from 'react'
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
        <div className="space-y-3 lg:mt-2">
          <Button
            variant="outline"
            className="w-full text-[8px] sm:text-xs h-6 lg:h-9"
            onClick={() => onAspectRatioChange()}
          >
            {maintainAspectRatio ? (
              <Lock className="w-1 h-1 lg:w-4 lg:h-4 mr-2" />
            ) : (
              <Unlock className="w-1 h-1 lg:w-4 lg:h-4 mr-2" />
            )}
            アスペクト比を{maintainAspectRatio ? 'ロック' : 'アンロック'}
          </Button>
          <div>
            <Label className="text-[8px] lg:text-sm text-muted-foreground">幅</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[resizeWidth]}
                onValueChange={([value]) => onWidthChange(value)}
                min={10}
                max={1000}
                step={1}
                className="flex-1"
              />
              <span className="text-[8px] lg:text-sm tabular-nums">
                {resizeWidth}px
              </span>
            </div>
          </div>

          <div>
            <Label className="text-[8px] lg:text-sm text-muted-foreground">高さ</Label>
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
              <span className="text-[8px] lg:text-sm tabular-nums">
                {resizeHeight}px
              </span>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}
