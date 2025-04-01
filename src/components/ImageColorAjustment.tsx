import { Contrast, Palette, Sun } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@radix-ui/react-separator';

export const ImageColorAjustment = () => {
	const [brightness, setBrightness] = useState(100);
	const [saturation, setSaturation] = useState(100);
	const [contrast, setContrast] = useState(100);

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
						onValueChange={([value]) => setBrightness(value)}
						min={0}
						max={200}
						step={1}
						className="w-full"
          />
					<div className="flex justify-between text-xs text-gray-500">
						<span>0%</span>
						<span>{brightness}%</span>
						<span>200%</span>
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
						onValueChange={([value]) => setSaturation(value)}
						min={0}
						max={200}
						step={1}
						className="w-full"
          />
					<div className="flex justify-between text-xs text-gray-500">
						<span>0%</span>
						<span>{saturation}%</span>
						<span>200%</span>
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
						onValueChange={([value]) => setContrast(value)}
						min={0}
						max={200}
						step={1}
						className="w-full"
          />
					<div className="flex justify-between text-xs text-gray-500">
						<span>0%</span>
						<span>{contrast}%</span>
						<span>200%</span>
					</div>
				</div>
			</div>

			<Separator />

			<div className="space-y-2">
				<Button
						variant="outline"
						className="w-full"
						onClick={() => {
							setBrightness(100);
							setSaturation(100);
							setContrast(100);
						}}
				>
					画像をリセット
				</Button>
			</div>
		</>
  )
}
