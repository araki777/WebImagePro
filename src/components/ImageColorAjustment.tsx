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
			<TabsList className="w-full flex justify-between gap-1 px-1 h-6 lg:h-9">
				<TabsTrigger value="basic" className="flex-1 min-w-0 px-2 py-1 text-[8px] sm:text-xs">
					<Sliders className="w-3 h-3 mr-1" />
					基本調整
				</TabsTrigger>
				<TabsTrigger value="advanced" className="flex-1 min-w-0 px-2 py-1 text-[8px] sm:text-xs">
					<Settings className="w-3 h-3 mr-1" />
					高度な調整
				</TabsTrigger>
			</TabsList>

			<TabsContent value="basic" className="space-y-3">
				{/* Basic Adjustment Controls */}
				<div className="grid grid-cols-2 gap-2">
					{/* Brightness */}
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 font-medium text-[8px] lg:text-sm">
							<Sun className="w-1 h-1 lg:w-4 lg:h-4" />
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
						<div className="flex justify-between text-[8px] lg:text-sm text-gray-500">
							<span>-100</span>
							<span>{brightness}</span>
							<span>100</span>
						</div>
					</div>

					{/* Saturation */}
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 text-[8px] lg:text-sm font-medium">
							<Palette className="w-1 h-1 lg:w-4 lg:h-4" />
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
						<div className="flex justify-between text-[8px] lg:text-sm text-gray-500">
							<span>0</span>
							<span>{saturation}</span>
							<span>2</span>
						</div>
					</div>

					{/* Contrast */}
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 text-[8px] lg:text-sm font-medium">
							<Contrast className="w-1 h-1 lg:w-4 lg:h-4" />
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
						<div className="flex justify-between text-[8px] lg:text-sm text-gray-500">
							<span>-100</span>
							<span>{contrast}</span>
							<span>100</span>
						</div>
					</div>
				</div>

				{/* Effect Switches */}
				<div className="grid grid-cols-3 gap-2">
					<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors h-6 lg:h-9">
						<label className="text-[8px] lg:text-sm font-medium whitespace-nowrap">グレースケール</label>
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

					<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors h-6 lg:h-9">
						<label className="text-[8px] lg:text-sm font-medium whitespace-nowrap">セピア</label>
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

					<div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors h-6 lg:h-9">
						<label className="text-[8px] lg:text-sm font-medium whitespace-nowrap">反転</label>
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

			<TabsContent value="advanced" className="space-y-3">
				{/* Advanced Adjustment Controls */}
				<div className="grid grid-cols-2 gap-2">
					{/* Gamma */}
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 text-[8px] lg:text-sm font-medium">
							<Contrast className="w-1 h-1 lg:w-4 lg:h-4" />
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
						<div className="flex justify-between text-[8px] lg:text-sm text-gray-500">
							<span>0</span>
							<span>{gamma}</span>
							<span>3</span>
						</div>
					</div>

					{/* Threshold */}
					<div className="space-y-1">
						<label className="flex items-center gap-1.5 text-[8px] lg:text-sm font-medium">
							<Contrast className="w-1 h-1 lg:w-4 lg:h-4" />
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
						<div className="flex justify-between text-[8px] lg:text-sm text-gray-500">
							<span>0</span>
							<span>{threshold}</span>
							<span>255</span>
						</div>
					</div>
				</div>

				{/* Color Balance */}
				<div className="space-y-1">
					<label className="text-[8px] lg:text-sm font-medium">カラーバランス</label>
					<div className="grid grid-cols-2 gap-2">
						<div className="space-y-1">
							<label className="flex items-center gap-1.5 text-[8px] lg:text-sm font-medium text-red-500">
								<Palette className="w-1 h-1 lg:w-4 lg:h-4" />
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
							<div className="flex justify-between text-[8px] lg:text-sm text-gray-500">
								<span>0</span>
								<span>{redFactor}</span>
								<span>2</span>
							</div>
						</div>

						<div className="space-y-1">
							<label className="flex items-center gap-1.5 text-[8px] lg:text-sm font-medium text-green-500">
								<Palette className="w-1 h-1 lg:w-4 lg:h-4" />
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
							<div className="flex justify-between text-[8px] lg:text-sm text-gray-500">
								<span>0</span>
								<span>{greenFactor}</span>
								<span>2</span>
							</div>
						</div>

						<div className="space-y-1">
							<label className="flex items-center gap-1.5 text-[8px] lg:text-sm font-medium text-blue-500">
								<Palette className="w-1 h-1 lg:w-4 lg:h-4" />
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
							<div className="flex justify-between text-[8px] lg:text-sm text-gray-500">
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
