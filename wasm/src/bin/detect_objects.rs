use std::path::Path;
use image::{DynamicImage, GenericImageView, Rgba, RgbaImage};
use std::env;
use ndarray::{Array, IxDyn};
use tract_onnx::prelude::*;

struct Detection {
    class_id: usize,
    class_name: String,
    confidence: f32,
    bbox: [f32; 4], // [x1, y1, x2, y2]
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();

    if args.len() < 3 {
        eprintln!("使用方法: {} <入力画像パス> <出力画像パス>", args[0]);
        std::process::exit(1);
    }

    let input_path = &args[1];
    let output_path = &args[2];

    println!("画像の読み込み中: {}", input_path);
    let img = image::open(input_path)?;
    let (img_width, img_height) = (img.width() as f32, img.height() as f32);

    // 入力パラメータ
    let input_size = 640;
    let confidence_threshold = 0.25;
    let iou_threshold = 0.45;

    // モデルパスは固定 (環境によってパスを調整)
    let mut model_path = Path::new("wasm/ai_models/yolo11n.onnx");
    if !model_path.exists() {
        println!("モデルファイルが見つかりません: {:?}", model_path);
        println!("直接モデルディレクトリ内のファイルを探しています...");
        let alt_model_path = Path::new("ai_models/yolo11n.onnx");
        if alt_model_path.exists() {
            println!("代替モデルパスが見つかりました: {:?}", alt_model_path);
            model_path = alt_model_path;
        } else {
            return Err(format!("モデルファイルが見つかりません: {:?} または {:?}", model_path, alt_model_path).into());
        }
    }

    println!("モデルの初期化中...");
    let model = tract_onnx::onnx()
        .model_for_path(model_path)?
        .into_optimized()?
        .into_runnable()?;

    // 画像前処理
    println!("画像前処理中...");
    let resized = img.resize_exact(
        input_size,
        input_size,
        image::imageops::FilterType::Triangle
    );

    let mut input_tensor = Array::zeros(IxDyn(&[1, 3, input_size as usize, input_size as usize]));
    for y in 0..input_size {
        for x in 0..input_size {
            let pixel = resized.get_pixel(x, y);
            // RGB -> BGR, 0-255 -> 0-1
            input_tensor[[0, 2, y as usize, x as usize]] = pixel[0] as f32 / 255.0;
            input_tensor[[0, 1, y as usize, x as usize]] = pixel[1] as f32 / 255.0;
            input_tensor[[0, 0, y as usize, x as usize]] = pixel[2] as f32 / 255.0;
        }
    }

    let input: Tensor = input_tensor.into_tensor();

    // 推論実行
    println!("オブジェクト検出を実行中...");
    let result = model.run(tvec!(input.into()))?;
    let output_tensor = result[0].to_array_view::<f32>()?;

    // 出力処理
    let mut detections = Vec::new();
    let output_shape = output_tensor.shape();
    println!("出力形状: {:?}", output_shape);

    // COCOクラス名
    let class_names = vec![
        "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
        "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
        "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
        "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
        "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
        "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
        "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
        "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote",
        "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book",
        "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
    ];

    // YOLOv8の出力を処理
    // 出力テンソルの形状に応じて処理を分岐
    if output_shape.len() >= 2 {
        let num_detection = if output_shape.len() == 3 {
            output_shape[1]
        } else {
            output_shape[0]
        };

        let num_classes = if output_shape.len() == 3 {
            output_shape[2] - 4
        } else {
            output_shape[1] - 4
        };

        println!("検出数: {}, クラス数: {}", num_detection, num_classes);

        // 検出結果を処理
        for i in 0..num_detection {
            let mut class_id = 0;
            let mut max_score = 0.0;

            // 各クラスの信頼度を確認
            for c in 0..num_classes {
                let confidence = if output_shape.len() == 3 {
                    output_tensor[[0, i, c + 4]]
                } else {
                    output_tensor[[i, c + 4]]
                };

                if confidence > max_score {
                    max_score = confidence;
                    class_id = c;
                }
            }

            // 信頼度閾値を超えるもののみ処理
            if max_score >= confidence_threshold {
                // バウンディングボックスの座標を取得
                let (x, y, w, h) = if output_shape.len() == 3 {
                    (
                        output_tensor[[0, i, 0]],
                        output_tensor[[0, i, 1]],
                        output_tensor[[0, i, 2]],
                        output_tensor[[0, i, 3]]
                    )
                } else {
                    (
                        output_tensor[[i, 0]],
                        output_tensor[[i, 1]],
                        output_tensor[[i, 2]],
                        output_tensor[[i, 3]]
                    )
                };

                // 元の画像サイズに合わせてバウンディングボックス座標を変換
                let x1 = (x - w / 2.0) * img_width;
                let y1 = (y - h / 2.0) * img_height;
                let x2 = (x + w / 2.0) * img_width;
                let y2 = (y + h / 2.0) * img_height;

                // 検出結果を保存
                detections.push(Detection {
                    class_id,
                    class_name: class_names[class_id].to_string(),
                    confidence: max_score,
                    bbox: [x1, y1, x2, y2],
                });
            }
        }
    }

    // 非最大抑制（NMS）を適用
    detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
    let mut result_detections = Vec::new();
    let mut selected_indices = vec![false; detections.len()];

    for i in 0..detections.len() {
        if selected_indices[i] {
            continue;
        }

        result_detections.push(detections[i].clone());
        selected_indices[i] = true;

        for j in (i + 1)..detections.len() {
            if selected_indices[j] {
                continue;
            }

            if detections[i].class_id == detections[j].class_id {
                let [x1_1, y1_1, x2_1, y2_1] = detections[i].bbox;
                let [x1_2, y1_2, x2_2, y2_2] = detections[j].bbox;

                let x1 = x1_1.max(x1_2);
                let y1 = y1_1.max(y1_2);
                let x2 = x2_1.min(x2_2);
                let y2 = y2_1.min(y2_2);

                let intersection_area = (x2 - x1).max(0.0) * (y2 - y1).max(0.0);
                let box1_area = (x2_1 - x1_1) * (y2_1 - y1_1);
                let box2_area = (x2_2 - x1_2) * (y2_2 - y1_2);
                let iou = intersection_area / (box1_area + box2_area - intersection_area);

                if iou > iou_threshold {
                    selected_indices[j] = true;
                }
            }
        }
    }

    // 検出結果を表示
    println!("検出結果:");
    for (i, detection) in result_detections.iter().enumerate() {
        println!(
            "{}. {} (信頼度: {:.2}%) 座標: [{:.1}, {:.1}, {:.1}, {:.1}]",
            i + 1,
            detection.class_name,
            detection.confidence * 100.0,
            detection.bbox[0],
            detection.bbox[1],
            detection.bbox[2],
            detection.bbox[3]
        );
    }

    // 結果を画像に描画
    println!("検出結果を画像に描画中...");
    let mut rgba_img = img.to_rgba8();

    for detection in &result_detections {
        let [x1, y1, x2, y2] = detection.bbox;
        let x1 = x1.max(0.0) as u32;
        let y1 = y1.max(0.0) as u32;
        let x2 = x2.min(rgba_img.width() as f32) as u32;
        let y2 = y2.min(rgba_img.height() as f32) as u32;

        // バウンディングボックスを描画
        draw_rectangle(&mut rgba_img, x1, y1, x2, y2);

        // ラベルを描画
        let text = format!("{}: {:.2}%", detection.class_name, detection.confidence * 100.0);
        draw_text(&mut rgba_img, x1, y1.saturating_sub(20), &text);
    }

    // 結果を保存
    println!("結果を保存中: {}", output_path);
    let img_with_boxes = DynamicImage::ImageRgba8(rgba_img);
    img_with_boxes.save(output_path)?;

    println!("完了しました。合計 {} 個のオブジェクトを検出しました。", result_detections.len());

    Ok(())
}

impl Clone for Detection {
    fn clone(&self) -> Self {
        Detection {
            class_id: self.class_id,
            class_name: self.class_name.clone(),
            confidence: self.confidence,
            bbox: self.bbox,
        }
    }
}

fn draw_rectangle(img: &mut RgbaImage, x1: u32, y1: u32, x2: u32, y2: u32) {
    let color = Rgba([255, 0, 0, 255]); // 赤色
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

fn draw_text(img: &mut RgbaImage, x: u32, y: u32, text: &str) {
    let color = Rgba([255, 255, 255, 255]); // 白色
    let background = Rgba([0, 0, 0, 180]); // 半透明の黒色

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
    for _c in text.chars() {
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