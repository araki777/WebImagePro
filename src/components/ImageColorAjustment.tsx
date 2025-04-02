import { Contrast, Palette, Sun, Sliders, Settings } from 'lucide-react'
import React from 'react'
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IImageColorAjustmentProps } from '@/types/types';

export const ImageColorAjustment = ({
	brightness,
	saturation,
	contrast,
	gamma,
	threshold,
	redFactor,
	greenFactor,
	blueFactor,
	isGrayScale,
	isSepia,
	isInvert,
	setBrightness,
	setSaturation,
	setContrast,
	setGamma,
	setThreshold,
	setRedFactor,
	setGreenFactor,
	setBlueFactor,
	setIsGrayScale,
	setIsSepia,
	setIsInvert,
	onBrightnessChange,
	onSaturationChange,
	onContrastChange,
	onGammaChange,
	onThresholdChange,
	onColorBalanceChange,
	onGrayscaleChange,
	onSepiaChange,
	onInvertChange,
	isSave
}: IImageColorAjustmentProps) => {

  return (
		<Tabs defaultValue="basic" className="w-full">
			<TabsList className="grid w-full grid-cols-2 mb-4">
				<TabsTrigger value="basic" className="flex items-center gap-1.5">
					<Sliders className="w-3.5 h-3.5" />
					基本調整
				</TabsTrigger>
				<TabsTrigger value="advanced" className="flex items-center gap-1.5">
					<Settings className="w-3.5 h-3.5" />
					高度な調整
				</TabsTrigger>
			</TabsList>

			<TabsContent value="basic" className="space-y-4">
				{/* Basic Adjustment Controls */}
				<div className="grid grid-cols-2 gap-3">
					{/* Brightness */}
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 text-sm font-medium">
							<Sun className="w-3.5 h-3.5" />
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
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 text-sm font-medium">
							<Palette className="w-3.5 h-3.5" />
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
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 text-sm font-medium">
							<Contrast className="w-3.5 h-3.5" />
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

				{/* Effect Switches */}
				<div className="grid grid-cols-3 gap-3">
					<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
						<label className="text-sm font-medium whitespace-nowrap">グレースケール</label>
						<Switch
							checked={isGrayScale}
							onCheckedChange={(checked) => {
								setIsGrayScale(checked);
								onGrayscaleChange(checked);
							}}
							disabled={isSave}
							className="data-[state=checked]:bg-blue-500"
						/>
					</div>

					<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
						<label className="text-sm font-medium whitespace-nowrap">セピア</label>
						<Switch
							checked={isSepia}
							onCheckedChange={(checked) => {
								setIsSepia(checked);
								onSepiaChange(checked);
							}}
							disabled={isSave}
							className="data-[state=checked]:bg-blue-500"
						/>
					</div>

					<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
						<label className="text-sm font-medium whitespace-nowrap">反転</label>
						<Switch
							checked={isInvert}
							onCheckedChange={(checked) => {
								setIsInvert(checked);
								onInvertChange(checked);
							}}
							disabled={isSave}
							className="data-[state=checked]:bg-blue-500"
						/>
					</div>
				</div>
			</TabsContent>

			<TabsContent value="advanced" className="space-y-4">
				{/* Advanced Adjustment Controls */}
				<div className="grid grid-cols-2 gap-3">
					{/* Gamma */}
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 text-sm font-medium">
							<Contrast className="w-3.5 h-3.5" />
							ガンマ
						</label>
						<Slider
							value={[gamma]}
							onValueChange={([value]) => {
								setGamma(value);
								onGammaChange(value)
							}}
							min={0}
							max={3}
							step={0.1}
							disabled={isSave}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-gray-500">
							<span>0</span>
							<span>{gamma}</span>
							<span>3</span>
						</div>
					</div>

					{/* Threshold */}
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 text-sm font-medium">
							<Contrast className="w-3.5 h-3.5" />
							白黒
						</label>
						<Slider
							value={[threshold]}
							onValueChange={([value]) => {
								setThreshold(value);
								onThresholdChange(value)
							}}
							min={0}
							max={255}
							step={1}
							disabled={isSave}
							className="w-full"
						/>
						<div className="flex justify-between text-xs text-gray-500">
							<span>0</span>
							<span>{threshold}</span>
							<span>255</span>
						</div>
					</div>
				</div>

				{/* Color Balance */}
				<div className="space-y-1">
					<label className="text-sm font-medium">カラーバランス</label>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<label className="flex items-center gap-1.5 text-sm font-medium text-red-500">
								<Palette className="w-3.5 h-3.5" />
								赤
							</label>
							<Slider
								value={[redFactor]}
								onValueChange={([value]) => {
									setRedFactor(value);
									onColorBalanceChange(value, greenFactor, blueFactor);
								}}
								min={0}
								max={2}
								step={0.1}
								disabled={isSave}
								className="w-full"
							/>
							<div className="flex justify-between text-xs text-gray-500">
								<span>0</span>
								<span>{redFactor}</span>
								<span>2</span>
							</div>
						</div>

						<div className="space-y-1">
							<label className="flex items-center gap-1.5 text-sm font-medium text-green-500">
								<Palette className="w-3.5 h-3.5" />
								緑
							</label>
							<Slider
								value={[greenFactor]}
								onValueChange={([value]) => {
									setGreenFactor(value);
									onColorBalanceChange(redFactor, value, blueFactor);
								}}
								min={0}
								max={2}
								step={0.1}
								disabled={isSave}
								className="w-full"
							/>
							<div className="flex justify-between text-xs text-gray-500">
								<span>0</span>
								<span>{greenFactor}</span>
								<span>2</span>
							</div>
						</div>

						<div className="space-y-1">
							<label className="flex items-center gap-1.5 text-sm font-medium text-blue-500">
								<Palette className="w-3.5 h-3.5" />
								青
							</label>
							<Slider
								value={[blueFactor]}
								onValueChange={([value]) => {
									setBlueFactor(value);
									onColorBalanceChange(redFactor, greenFactor, value);
								}}
								min={0}
								max={2}
								step={0.1}
								disabled={isSave}
								className="w-full"
							/>
							<div className="flex justify-between text-xs text-gray-500">
								<span>0</span>
								<span>{blueFactor}</span>
								<span>2</span>
							</div>
						</div>
					</div>
				</div>
			</TabsContent>
		</Tabs>
  )
}
