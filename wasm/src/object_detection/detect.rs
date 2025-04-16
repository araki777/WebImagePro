use std::path::Path;
use image::DynamicImage;
use crate::object_detection::yolo::{YoloModel, YoloDetection};

pub struct Detection {
    pub class_id: usize,
    pub class_name: String,
    pub confidence: f32,
    pub bbox: [f32; 4], // [x1, y1, x2, y2]
}

pub struct ObjectDetector {
    model: YoloModel,
}

impl ObjectDetector {
    pub fn new(
        model_path: &Path,
        input_height: usize,
        input_width: usize,
        confidence_threshold: f32,
        iou_threshold: f32,
    ) -> Result<Self, anyhow::Error> {
        let model = YoloModel::new(
            model_path,
            input_height,
            input_width,
            confidence_threshold,
            iou_threshold,
        )?;

        Ok(ObjectDetector { model })
    }

    pub fn detect(&self, image: &DynamicImage) -> Result<Vec<Detection>, anyhow::Error> {
        let yolo_detections = self.model.detect(image)?;

        let detections = yolo_detections.into_iter()
            .map(|d| {
                Detection {
                    class_id: d.class_id,
                    class_name: self.model.get_class_name(d.class_id)
                        .unwrap_or("unknown")
                        .to_string(),
                    confidence: d.confidence,
                    bbox: d.bbox,
                }
            })
            .collect();

        Ok(detections)
    }

    pub fn draw_detections(&self, image: &mut DynamicImage, detections: &[Detection]) {
        let mut img = image.to_rgba8();

        for detection in detections {
            let [x1, y1, x2, y2] = detection.bbox;
            let x1 = x1.max(0.0) as u32;
            let y1 = y1.max(0.0) as u32;
            let x2 = x2.min(img.width() as f32) as u32;
            let y2 = y2.min(img.height() as f32) as u32;

            // バウンディングボックスを描画
            draw_rectangle(&mut img, x1, y1, x2, y2);

            // ラベルを描画
            let text = format!("{}: {:.2}%", detection.class_name, detection.confidence * 100.0);
            draw_text(&mut img, x1, y1.saturating_sub(10), &text);
        }

        *image = DynamicImage::ImageRgba8(img);
    }
}

fn draw_rectangle(img: &mut image::RgbaImage, x1: u32, y1: u32, x2: u32, y2: u32) {
    let color = image::Rgba([255, 0, 0, 255]); // 赤色
    let thickness = 2;

    // 上辺
    for i in x1..=x2 {
        for t in 0..thickness {
            if y1 + t < img.height() {
                img.put_pixel(i, y1 + t, color);
            }
        }
    }

    // 下辺
    for i in x1..=x2 {
        for t in 0..thickness {
            if y2 >= t && y2 - t < img.height() {
                img.put_pixel(i, y2 - t, color);
            }
        }
    }

    // 左辺
    for i in y1..=y2 {
        for t in 0..thickness {
            if x1 + t < img.width() {
                img.put_pixel(x1 + t, i, color);
            }
        }
    }

    // 右辺
    for i in y1..=y2 {
        for t in 0..thickness {
            if x2 >= t && x2 - t < img.width() {
                img.put_pixel(x2 - t, i, color);
            }
        }
    }
}

fn draw_text(img: &mut image::RgbaImage, x: u32, y: u32, text: &str) {
    let color = image::Rgba([255, 255, 255, 255]); // 白色
    let font_size = 15.0;
    let background = image::Rgba([0, 0, 0, 180]); // 半透明の黒色

    // テキストサイズを計算（簡易的な実装）
    let text_width = text.len() as u32 * 8;
    let text_height = 20;

    // 背景を描画
    for j in 0..text_height {
        for i in 0..text_width {
            if x + i < img.width() && y + j < img.height() {
                img.put_pixel(x + i, y + j, background);
            }
        }
    }

    // 実際のテキスト描画はシンプルに実装（フォントレンダリングが複雑なため）
    // 本格的には rusttype クレートなどを使用して実装する
    let mut x_offset = 0;
    for c in text.chars() {
        if x + x_offset + 8 < img.width() && y + 15 < img.height() {
            // 各文字を固定幅で描画（簡易的な実装）
            for i in 0..8 {
                for j in 0..15 {
                    if (i > 1 && i < 6) && (j > 1 && j < 13) {
                        img.put_pixel(x + x_offset + i, y + j, color);
                    }
                }
            }
        }
        x_offset += 8;
    }
}
