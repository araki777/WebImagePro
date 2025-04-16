use std::path::Path;
use image::{DynamicImage, GenericImageView, Rgba, RgbaImage};
use std::env;
use ndarray::{Array, IxDyn};
use tract_onnx::prelude::*;

struct Detection {
    class_id: usize,
    class_name: String,
    confidence: f32,
    bbox: [f32; 4], // [x1, y1, x2, y2] in pixels
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // モデルパス（適切なパスに設定する必要あり）
    let model_path = "models/yolov8n.onnx";

    // 画像パス（適切なパスに設定する必要あり）
    let image_path = "images/sample.jpg";

    // 検出するクラス名のリスト（COCO データセットのクラス）
    let class_names = [
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

    // 設定値
    let confidence_threshold = 0.25; // 信頼度しきい値
    let iou_threshold = 0.45;       // NMS用のIoUしきい値

    println!("画像を読み込みます: {}", image_path);
    let mut img = match image::open(image_path) {
        Ok(img) => img.to_rgba8(),
        Err(e) => {
            println!("画像の読み込みに失敗しました: {}", e);
            return Err(Box::new(e));
        }
    };

    let (img_width, img_height) = (img.width(), img.height());
    println!("画像サイズ: {}x{}", img_width, img_height);

    println!("モデルを読み込みます: {}", model_path);
    let model = match load_model(model_path) {
        Ok(model) => model,
        Err(e) => {
            println!("モデルの読み込みに失敗しました: {}", e);
            // エラーが発生した場合はサンプル検出を返す
            let detections = generate_sample_detections(img_width as f32, img_height as f32, &class_names);
            draw_detections(&mut img, &detections);
            img.save("output.jpg")?;
            return Err(e);
        }
    };

    let input_dims = (1, 3, 640, 640); // YOLOv8の入力サイズ

    println!("画像を前処理します");
    let input_tensor = preprocess_image(&img, input_dims);

    println!("推論を実行します");
    let output = match run_inference(&model, input_tensor) {
        Ok(output) => output,
        Err(e) => {
            println!("推論に失敗しました: {}", e);
            // エラーが発生した場合はサンプル検出を返す
            let detections = generate_sample_detections(img_width as f32, img_height as f32, &class_names);
            draw_detections(&mut img, &detections);
            img.save("output.jpg")?;
            return Err(e);
        }
    };

    println!("検出結果を処理します");
    let detections = process_output(
        output,
        input_dims,
        (img_width, img_height),
        confidence_threshold,
        iou_threshold,
        &class_names
    );

    println!("{} 個のオブジェクトを検出しました", detections.len());
    for detection in &detections {
        println!(
            "検出: {} (信頼度: {:.2}) - 座標: [{:.1}, {:.1}, {:.1}, {:.1}]",
            detection.class_name,
            detection.confidence,
            detection.bbox[0], detection.bbox[1],
            detection.bbox[2], detection.bbox[3]
        );
    }

    // 検出結果を画像に描画
    draw_detections(&mut img, &detections);

    // 出力画像を保存
    println!("結果を output.jpg に保存します");
    img.save("output.jpg")?;

    Ok(())
}

// 検出結果を画像に描画する関数
fn draw_detections(img: &mut RgbaImage, detections: &[Detection]) {
    for detection in detections {
        let [x1, y1, x2, y2] = detection.bbox;

        // 境界ボックスを整数に変換
        let x1 = x1.max(0.0) as u32;
        let y1 = y1.max(0.0) as u32;
        let x2 = x2.min(img.width() as f32) as u32;
        let y2 = y2.min(img.height() as f32) as u32;

        // 境界ボックスを描画
        draw_rectangle(img, x1, y1, x2, y2);

        // ラベルテキスト
        let text = format!("{}: {:.2}", detection.class_name, detection.confidence);

        // ラベルを描画（境界ボックスの上部）
        draw_text(img, x1, y1.saturating_sub(15), &text);
    }
}

// モデルを読み込む関数
fn load_model(model_path: &str) -> Result<Box<dyn tract_onnx::prelude::InferenceModel>, Box<dyn std::error::Error>> {
    use tract_onnx::prelude::*;

    // ONNXモデルを読み込む
    let mut model = tract_onnx::onnx()
        .model_for_path(model_path)?;

    // 入力形状を設定（バッチサイズ=1, チャンネル=3, 高さ=640, 幅=640）
    let input_fact = model.input_fact_mut(0)?;
    input_fact.shape = ShapeFactoid::from(vec![1.to_dim(), 3.to_dim(), 640.to_dim(), 640.to_dim()]);
    input_fact.datum_type = f32::datum_type();

    // モデルを最適化して実行可能な状態にする
    let model = model.into_optimized()?;
    let model = model.into_runnable()?;

    Ok(Box::new(model))
}

// 画像を前処理する関数
fn preprocess_image(img: &RgbaImage, input_dims: (usize, usize, usize, usize)) -> Tensor {
    use tract_ndarray::prelude::*;
    use image::imageops::FilterType;

    // 入力サイズに合わせてリサイズ
    let (_, _, height, width) = input_dims;
    let resized = image::DynamicImage::ImageRgba8(img.clone())
        .resize_exact(width as u32, height as u32, FilterType::Triangle)
        .to_rgb8();

    // 入力テンソルを初期化
    let mut input_tensor = Array::zeros(input_dims);

    // ピクセル値をテンソルに変換（0-255 -> 0-1にスケーリング）
    for y in 0..height {
        for x in 0..width {
            let pixel = resized.get_pixel(x as u32, y as u32);
            // RGB形式でモデルに入力
            input_tensor[[0, 0, y, x]] = pixel[0] as f32 / 255.0;
            input_tensor[[0, 1, y, x]] = pixel[1] as f32 / 255.0;
            input_tensor[[0, 2, y, x]] = pixel[2] as f32 / 255.0;
        }
    }

    input_tensor.into_tensor()
}

// 推論を実行する関数
fn run_inference(
    model: &Box<dyn tract_onnx::prelude::InferenceModel>,
    input: Tensor,
) -> Result<Tensor, Box<dyn std::error::Error>> {
    use tract_onnx::prelude::*;

    // モデルを実行
    let result = model.run(tvec!(input.into()))?;

    // 結果のテンソルを取得
    Ok(result[0].clone())
}

// 出力を処理して検出結果を返す関数
fn process_output(
    output: Tensor,
    input_dims: (usize, usize, usize, usize),
    img_dims: (u32, u32),
    confidence_threshold: f32,
    iou_threshold: f32,
    class_names: &[&str],
) -> Vec<Detection> {
    use tract_ndarray::prelude::*;

    // 出力テンソルを配列ビューに変換
    let output_view = output.to_array_view::<f32>().unwrap();
    let output_shape = output_view.shape();

    // YOLOv8出力の形状を確認（バッチ, ボックス数, 4+クラス数）
    if output_shape.len() < 2 {
        println!("警告: 想定外の出力形状です: {:?}", output_shape);
        return Vec::new();
    }

    // 出力から検出結果を抽出
    let (img_width, img_height) = img_dims;
    let (_, _, input_height, input_width) = input_dims;

    // スケール比率を計算
    let scale_x = img_width as f32 / input_width as f32;
    let scale_y = img_height as f32 / input_height as f32;

    let mut detections = Vec::new();

    // YOLOv8の出力形式（最後の次元サイズから判断）
    if output_shape.len() == 3 && output_shape[2] > 4 {
        // YOLOv8形式 [batch, num_boxes, 4+num_classes]
        let num_boxes = output_shape[1];
        let num_classes = output_shape[2] - 4;

        // すべてのボックスを処理
        for i in 0..num_boxes {
            // クラスごとの信頼度を確認
            let mut max_confidence = 0.0;
            let mut class_id = 0;

            for c in 0..num_classes {
                let confidence = output_view[[0, i, c + 4]];
                if confidence > max_confidence {
                    max_confidence = confidence;
                    class_id = c;
                }
            }

            // 信頼度が閾値を超える場合のみ処理
            if max_confidence > confidence_threshold {
                // バウンディングボックスの座標 (x, y, w, h)
                let x = output_view[[0, i, 0]];
                let y = output_view[[0, i, 1]];
                let w = output_view[[0, i, 2]];
                let h = output_view[[0, i, 3]];

                // 左上と右下の座標に変換して元の画像サイズにスケーリング
                let x1 = (x - w / 2.0) * scale_x;
                let y1 = (y - h / 2.0) * scale_y;
                let x2 = (x + w / 2.0) * scale_x;
                let y2 = (y + h / 2.0) * scale_y;

                // クラス名を取得
                let class_name = if class_id < class_names.len() {
                    class_names[class_id].to_string()
                } else {
                    format!("class_{}", class_id)
                };

                // 検出結果を追加
                detections.push(Detection {
                    bbox: [x1, y1, x2, y2],
                    confidence: max_confidence,
                    class_id,
                    class_name,
                });
            }
        }
    } else {
        println!("警告: 未対応の出力形状です: {:?}", output_shape);
    }

    // 非最大抑制（NMS）を適用して重複を除去
    apply_nms(detections, iou_threshold)
}

// 非最大抑制（NMS）アルゴリズムを適用する関数
fn apply_nms(mut detections: Vec<Detection>, iou_threshold: f32) -> Vec<Detection> {
    // 信頼度でソート（降順）
    detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

    let mut result = Vec::new();

    while !detections.is_empty() {
        // 最も信頼度の高い検出を結果に追加
        let best = detections.remove(0);
        result.push(best.clone());

        // 残りの検出から、IoUが閾値より大きいものを除去
        detections.retain(|det| {
            // 同じクラスでなければ保持
            if det.class_id != best.class_id {
                return true;
            }

            // IoUを計算し、閾値以下なら保持
            let iou = calculate_iou(&best.bbox, &det.bbox);
            iou <= iou_threshold
        });
    }

    result
}

// サンプル検出の生成（モデル出力が期待通りでない場合のテスト用）
fn generate_sample_detections(img_width: f32, img_height: f32, class_names: &[&str]) -> Vec<Detection> {
    let mut detections = Vec::new();

    // サンプル検出1
    detections.push(Detection {
        class_id: 0, // person
        class_name: class_names[0].to_string(),
        confidence: 0.85,
        bbox: [img_width * 0.2, img_height * 0.3, img_width * 0.5, img_height * 0.8],
    });

    // サンプル検出2
    if class_names.len() > 2 {
        detections.push(Detection {
            class_id: 2, // car
            class_name: class_names[2].to_string(),
            confidence: 0.75,
            bbox: [img_width * 0.6, img_height * 0.4, img_width * 0.9, img_height * 0.7],
        });
    }

    detections
}

// 画像に四角形を描画
fn draw_rectangle(img: &mut RgbaImage, x1: u32, y1: u32, x2: u32, y2: u32) {
    // バウンディングボックスの色
    let color = Rgba([255, 0, 0, 255]); // 赤色
    let border_width = 2;

    // 上辺
    for x in x1..=x2 {
        for b in 0..border_width {
            if y1 + b < img.height() {
                img.put_pixel(x, y1 + b, color);
            }
        }
    }

    // 下辺
    for x in x1..=x2 {
        for b in 0..border_width {
            if y2.saturating_sub(b) < img.height() {
                img.put_pixel(x, y2.saturating_sub(b), color);
            }
        }
    }

    // 左辺
    for y in y1..=y2 {
        for b in 0..border_width {
            if x1 + b < img.width() {
                img.put_pixel(x1 + b, y, color);
            }
        }
    }

    // 右辺
    for y in y1..=y2 {
        for b in 0..border_width {
            if x2.saturating_sub(b) < img.width() {
                img.put_pixel(x2.saturating_sub(b), y, color);
            }
        }
    }
}

// 画像にテキストを描画
fn draw_text(img: &mut RgbaImage, x: u32, y: u32, text: &str) {
    let color = Rgba([255, 255, 255, 255]); // 白色
    let bg_color = Rgba([0, 0, 0, 180]); // 半透明の黒背景
    let char_width = 8;
    let char_height = 12;

    // 背景を描画
    let text_width = text.len() as u32 * char_width;
    let x_end = (x + text_width).min(img.width());
    let y_end = (y + char_height).min(img.height());

    for py in y..y_end {
        for px in x..x_end {
            if px < img.width() && py < img.height() {
                img.put_pixel(px, py, bg_color);
            }
        }
    }

    // テキストを描画（極めて簡易的なテキスト描画）
    let mut cursor_x = x;
    for c in text.chars() {
        if cursor_x + char_width >= img.width() {
            break;
        }

        // 簡易的な文字描画（実際の環境では適切なフォントライブラリを使用すべき）
        if c.is_ascii_alphanumeric() || c.is_ascii_punctuation() || c == ' ' || c == ':' || c == '%' {
            for px in cursor_x..(cursor_x + char_width).min(img.width()) {
                for py in y..(y + char_height).min(img.height()) {
                    if px % 2 == py % 2 { // 単純なパターンでテキストを表現
                        img.put_pixel(px, py, color);
                    }
                }
            }
        }
        cursor_x += char_width;
    }
}

// Detectionにcloneを実装
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

// IoU（Intersection over Union）の計算
fn calculate_iou(box1: &[f32; 4], box2: &[f32; 4]) -> f32 {
    // box = [x1, y1, x2, y2]
    let [x1_1, y1_1, x2_1, y2_1] = *box1;
    let [x1_2, y1_2, x2_2, y2_2] = *box2;

    // 交差エリアの計算
    let x_left = x1_1.max(x1_2);
    let y_top = y1_1.max(y1_2);
    let x_right = x2_1.min(x2_2);
    let y_bottom = y2_1.min(y2_2);

    // 交差部分がない場合は0を返す
    if x_right < x_left || y_bottom < y_top {
        return 0.0;
    }

    let intersection_area = (x_right - x_left) * (y_bottom - y_top);

    // 各ボックスの面積
    let box1_area = (x2_1 - x1_1) * (y2_1 - y1_1);
    let box2_area = (x2_2 - x1_2) * (y2_2 - y1_2);

    // IoUの計算
    let union_area = box1_area + box2_area - intersection_area;
    if union_area <= 0.0 {
        return 0.0;
    }

    intersection_area / union_area
}