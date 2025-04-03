import React from 'react'
import { RATIOS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { IImageCliperProps } from '@/types/types'

export const ImageCliper = ({ selectedRatio, onRatioChange, onClip, isSave }: IImageCliperProps) => {
  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        切り抜き領域をドラッグして移動、またはハンドルをドラッグしてサイズを変更できます
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {RATIOS.map((ratio) => (
          <Button
            key={ratio.name}
            variant={selectedRatio.name === ratio.name ? "default" : "outline"}
            className="w-full h-8 text-sm"
            onClick={() => onRatioChange(ratio)}
          >
            {ratio.name}
          </Button>
        ))}
      </div>

      <Button
        className="w-full h-8 text-sm"
        onClick={onClip}
        disabled={isSave}
      >
        切り取りを実行
      </Button>
    </div>
  )
}
