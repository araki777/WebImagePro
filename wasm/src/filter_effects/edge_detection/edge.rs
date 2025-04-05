use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

/// エッジ検出を適用する（Sobelフィルター）
#[wasm_bindgen]
pub fn apply_edge_detection(input: &[u8], threshold: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // グレースケールに変換
    let gray_img = img.to_luma8();

    // エッジ検出を適用（カスタム実装）
    let mut edges = gray_img.clone();
    let (width, height) = edges.dimensions();

    for y in 1..height-1 {
        for x in 1..width-1 {
            let mut gx = 0i32;
            let mut gy = 0i32;

            // Sobelフィルターのx方向
            gx += -1 * gray_img.get_pixel(x-1, y-1)[0] as i32;
            gx += -2 * gray_img.get_pixel(x-1, y)[0] as i32;
            gx += -1 * gray_img.get_pixel(x-1, y+1)[0] as i32;
            gx += 1 * gray_img.get_pixel(x+1, y-1)[0] as i32;
            gx += 2 * gray_img.get_pixel(x+1, y)[0] as i32;
            gx += 1 * gray_img.get_pixel(x+1, y+1)[0] as i32;

            // Sobelフィルターのy方向
            gy += -1 * gray_img.get_pixel(x-1, y-1)[0] as i32;
            gy += -2 * gray_img.get_pixel(x, y-1)[0] as i32;
            gy += -1 * gray_img.get_pixel(x+1, y-1)[0] as i32;
            gy += 1 * gray_img.get_pixel(x-1, y+1)[0] as i32;
            gy += 2 * gray_img.get_pixel(x, y+1)[0] as i32;
            gy += 1 * gray_img.get_pixel(x+1, y+1)[0] as i32;

            let magnitude = ((gx * gx + gy * gy) as f32).sqrt();
            edges.put_pixel(x, y, image::Luma([if magnitude > threshold { 255 } else { 0 }]));
        }
    }

    // PNGとして出力
    edges.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{RgbImage, Rgb};

    #[test]
    fn test_edge_detection() {
        // テスト用のシンプルな画像を作成（境界がはっきりした画像）
        let mut img = RgbImage::new(20, 20);
        
        // 左半分を黒、右半分を白にする
        for y in 0..20 {
            for x in 0..10 {
                img.put_pixel(x, y, Rgb([0, 0, 0]));
            }
            for x in 10..20 {
                img.put_pixel(x, y, Rgb([255, 255, 255]));
            }
        }

        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();

        // エッジ検出を適用
        let threshold = 50.0;
        let result = apply_edge_detection(&input_buf, threshold);

        // 結果がPNGフォーマットで返されていることを確認
        assert!(!result.is_empty());
        
        // 画像デコードができることを確認
        let decoded = ImageReader::new(std::io::Cursor::new(&result))
            .with_guessed_format()
            .unwrap()
            .decode();
        assert!(decoded.is_ok());
        
        // 元のサイズと同じであることを確認
        let decoded_img = decoded.unwrap();
        assert_eq!(decoded_img.width(), 20);
        assert_eq!(decoded_img.height(), 20);
    }
    
    #[test]
    fn test_various_thresholds() {
        // テスト用の画像を作成（四角形）
        let mut img = RgbImage::new(30, 30);
        
        // 背景は黒
        for y in 0..30 {
            for x in 0..30 {
                img.put_pixel(x, y, Rgb([0, 0, 0]));
            }
        }
        
        // 中央に白い四角形を描画
        for y in 10..20 {
            for x in 10..20 {
                img.put_pixel(x, y, Rgb([255, 255, 255]));
            }
        }
        
        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();
        
        // 異なる閾値でエッジ検出を適用
        let thresholds = [10.0, 50.0, 100.0, 200.0];
        
        for &threshold in &thresholds {
            let result = apply_edge_detection(&input_buf, threshold);
            assert!(!result.is_empty());
            
            // デコードできることを確認
            let decoded = ImageReader::new(std::io::Cursor::new(&result))
                .with_guessed_format()
                .unwrap()
                .decode();
            assert!(decoded.is_ok());
        }
    }
} 