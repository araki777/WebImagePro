'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PencilLine, Bluetooth as Blur, Type, Eraser, Undo2, Redo2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImage: string) => void;
  onClose: () => void;
}

export function ImageEditor({ imageUrl, onSave, onClose }: ImageEditorProps) {
  const [activeTab, setActiveTab] = useState("draw");
  const [brushSize, setBrushSize] = useState(5);
  const [blurIntensity, setBlurIntensity] = useState(5);
  const [textContent, setTextContent] = useState("");
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState("#000000");
  const [brushColor, setBrushColor] = useState("#000000");
  const [selectedFont, setSelectedFont] = useState("sans");

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container flex h-full items-center justify-center">
        <Card className="w-full max-w-6xl">
          <CardContent className="p-6">
            <div className="flex gap-6 h-[600px]">
              {/* 左側: プレビュー領域 */}
              <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="編集中の画像"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain"
                  priority
                />
                {/* キャンバスは後で実装 */}
                <canvas
                  className="absolute inset-0 w-full h-full"
                  style={{ display: 'none' }}
                />
              </div>

              {/* 右側: 編集ツール */}
              <div className="w-72 flex flex-col">
                <div className="flex justify-between mb-4">
                  <Button variant="outline" size="sm" onClick={onClose}>
                    キャンセル
                  </Button>
                  <Button size="sm" onClick={() => onSave(imageUrl)}>
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="draw" className="flex items-center gap-2">
                      <PencilLine className="w-4 h-4" />
                      描画
                    </TabsTrigger>
                    <TabsTrigger value="blur" className="flex items-center gap-2">
                      <Blur className="w-4 h-4" />
                      ぼかし
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      テキスト
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="draw" className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>ブラシサイズ: {brushSize}px</Label>
                        <div className="flex gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Undo2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <Redo2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Slider
                        value={[brushSize]}
                        onValueChange={([value]) => setBrushSize(value)}
                        min={1}
                        max={50}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>ブラシカラー</Label>
                      <Input
                        type="color"
                        className="h-10 p-1"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1">
                        <PencilLine className="w-4 h-4 mr-2" />
                        ペン
                      </Button>
                      <Button variant="secondary" className="flex-1">
                        <Eraser className="w-4 h-4 mr-2" />
                        消しゴム
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="blur" className="space-y-4">
                    <div className="space-y-2">
                      <Label>ぼかしの強さ: {blurIntensity}</Label>
                      <Slider
                        value={[blurIntensity]}
                        onValueChange={([value]) => setBlurIntensity(value)}
                        min={0}
                        max={20}
                        step={1}
                      />
                    </div>
                    <Button className="w-full" onClick={() => {}}>
                      ぼかしを適用
                    </Button>
                  </TabsContent>

                  <TabsContent value="text" className="space-y-4">
                    <div className="space-y-2">
                      <Label>テキスト</Label>
                      <Input
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="テキストを入力..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>フォントサイズ: {fontSize}px</Label>
                      <Slider
                        value={[fontSize]}
                        onValueChange={([value]) => setFontSize(value)}
                        min={8}
                        max={72}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>フォント</Label>
                      <Select value={selectedFont} onValueChange={setSelectedFont}>
                        <SelectTrigger>
                          <SelectValue placeholder="フォントを選択" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sans">Sans-serif</SelectItem>
                          <SelectItem value="serif">Serif</SelectItem>
                          <SelectItem value="mono">Monospace</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>文字色</Label>
                      <Input
                        type="color"
                        className="h-10 p-1"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={() => {}}>
                      テキストを追加
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}