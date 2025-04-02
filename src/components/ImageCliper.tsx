import React from 'react'
import { Label } from '@/components/ui/label'
import { RATIOS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { IImageCliperProps } from '@/types/types'

export const ImageCliper = ({ selectedRatio, onRatioChange, onClip, isSave }: IImageCliperProps) => {
  return (
    <div className="space-y-4">
        <div className="text-sm text-muted-foreground mb-4">
        切り抜き領域をドラッグして移動、またはハンドルをドラッグしてサイズを変更できます
        </div>

        <Label className="text-sm text-muted-foreground">比率</Label>
        <div className="grid grid-cols-2 gap-2">
        {RATIOS.map((ratio) => (
            <Button
            key={ratio.name}
            variant={selectedRatio.name === ratio.name ? "default" : "outline"}
            className="w-full"
            onClick={() => onRatioChange(ratio)}
            >
            {ratio.name}
            </Button>
        ))}
        </div>
        <Button
					className="w-full"
					onClick={onClip}
					disabled={isSave}
        >
          切り取りを実行
        </Button>
    </div>
  )
}
