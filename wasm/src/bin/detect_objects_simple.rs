use std::path::Path;
use image::{DynamicImage, GenericImageView, Rgba, RgbaImage};
use std::env;

// 検出オブジェクト（サンプル用）
struct Detection {
    class_name: String,
    confidence: f32,
    bbox: [f32; 4], // [x1, y1, x2, y2] in pixels
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

    println!("サンプル検出を実行中...");

    // 実際のモデル推論の代わりに、サンプル検出結果を生成
    let detections = generate_sample_detections(img_width, img_height);

    // 検出結果を表示
    println!("検出結果:");
    for (i, detection) in detections.iter().enumerate() {
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

    for detection in &detections {
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

    println!("完了しました。合計 {} 個のオブジェクトを検出しました。", detections.len());

    Ok(())
}

// サンプル検出結果を生成する関数
fn generate_sample_detections(img_width: f32, img_height: f32) -> Vec<Detection> {
    // 画像の中央に人物を検出したと仮定
    let person = Detection {
        class_name: "person".to_string(),
        confidence: 0.92,
        bbox: [
            img_width * 0.3,
            img_height * 0.2,
            img_width * 0.5,
            img_height * 0.8
        ],
    };

    // 右側に車を検出したと仮定
    let car = Detection {
        class_name: "car".to_string(),
        confidence: 0.86,
        bbox: [
            img_width * 0.6,
            img_height * 0.5,
            img_width * 0.9,
            img_height * 0.7
        ],
    };

    // 左側に木を検出したと仮定
    let tree = Detection {
        class_name: "potted plant".to_string(),
        confidence: 0.78,
        bbox: [
            img_width * 0.05,
            img_height * 0.3,
            img_width * 0.2,
            img_height * 0.9
        ],
    };

    // 建物
    let building = Detection {
        class_name: "building".to_string(),
        confidence: 0.65,
        bbox: [
            img_width * 0.55,
            img_height * 0.1,
            img_width * 0.85,
            img_height * 0.4
        ],
    };

    vec![person, car, tree, building]
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