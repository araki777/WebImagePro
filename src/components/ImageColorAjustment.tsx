import { Contrast, Palette, Sun } from 'lucide-react'
import React from 'react'
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { IImageColorAjustmentProps } from '@/types/types';

export const ImageColorAjustment = ({
	brightness,
	saturation,
	contrast,
	setBrightness,
	setSaturation,
	setContrast,
	onBrightnessChange,
	onSaturationChange,
	onContrastChange,
	isSave
}: IImageColorAjustmentProps) => {

  return (
		<>
			{/* Adjustment Controls */}
			<div className="space-y-4">
				{/* Brightness */}
				<div className="space-y-2">
					<label className="flex items-center gap-2 text-sm font-medium">
						<Sun className="w-4 h-4" />
						明度
					</label>
					<Slider
						value={[brightness]}
						onValueChange={([value]) => {
							setBrightness(value);
							onBrightnessChange(value)
						}}
						min={-100}
						max={100}
						step={1}
						disabled={isSave}
						className="w-full"
          />
					<div className="flex justify-between text-xs text-gray-500">
						<span>-100</span>
						<span>{brightness}</span>
						<span>100</span>
					</div>
				</div>

				{/* Saturation */}
				<div className="space-y-2">
					<label className="flex items-center gap-2 text-sm font-medium">
						<Palette className="w-4 h-4" />
						彩度
					</label>
					<Slider
						value={[saturation]}
						onValueChange={([value]) => {
							setSaturation(value);
							onSaturationChange(value)
						}}
						min={0}
						max={2}
						step={1}
						disabled={isSave}
						className="w-full"
          />
					<div className="flex justify-between text-xs text-gray-500">
						<span>0</span>
						<span>{saturation}</span>
						<span>2</span>
					</div>
				</div>

				{/* Contrast */}
				<div className="space-y-2">
					<label className="flex items-center gap-2 text-sm font-medium">
						<Contrast className="w-4 h-4" />
						コントラスト
					</label>
					<Slider
						value={[contrast]}
						onValueChange={([value]) => {
							setContrast(value);
							onContrastChange(value)
						}}
						min={-100}
						max={100}
						step={1}
						disabled={isSave}
						className="w-full"
          />
					<div className="flex justify-between text-xs text-gray-500">
						<span>-100</span>
						<span>{contrast}</span>
						<span>100</span>
					</div>
				</div>
			</div>

			<Separator />
		</>
  )
}
