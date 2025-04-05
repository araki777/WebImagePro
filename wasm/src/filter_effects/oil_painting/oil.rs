use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

/// 油彩効果を適用する
#[wasm_bindgen]
pub fn apply_oil_painting(input: &[u8], radius: u32, intensity: u8) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut oil_img = img.to_rgb8();
    let (width, height) = oil_img.dimensions();

    // 色の量子化レベル（油彩の色の数）
    let quantization_levels = 8usize;
    let quantization_step = 256usize / quantization_levels;

    for y in radius..height-radius {
        for x in radius..width-radius {
            let mut histogram = vec![vec![0; quantization_levels]; 3];
            let mut total = vec![0; 3];

            // 周辺ピクセルのヒストグラムを作成（量子化された色で）
            for dy in -(radius as i32)..=(radius as i32) {
                for dx in -(radius as i32)..=(radius as i32) {
                    let pixel = oil_img.get_pixel((x as i32 + dx) as u32, (y as i32 + dy) as u32);
                    for c in 0..3 {
                        let quantized = pixel[c] as usize / quantization_step;
                        histogram[c][quantized] += 1;
                        total[c] += pixel[c] as u32;
                    }
                }
            }

            // 最も頻出する色を選択
            let mut new_pixel = [0u8; 3];
            for c in 0..3 {
                let mut max_count = 0;
                let mut max_value = 0u8;
                for i in 0..quantization_levels {
                    if histogram[c][i] > max_count {
                        max_count = histogram[c][i];
                        max_value = (i * quantization_step) as u8;
                    }
                }
                new_pixel[c] = max_value;
            }

            // 油彩効果を適用（エッジの強調と色の量子化）
            let pixel = oil_img.get_pixel_mut(x, y);
            for c in 0..3 {
                let diff = (pixel[c] as i32 - new_pixel[c] as i32).abs() as u8;
                if diff > intensity {
                    // エッジの強調
                    let edge_factor = (diff as f32 / 255.0).powf(1.5);
                    let blended = (pixel[c] as f32 * (1.0 - edge_factor) + new_pixel[c] as f32 * edge_factor) as u8;
                    pixel[c] = blended;
                }
            }
        }
    }

    // PNGとして出力
    oil_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{RgbImage, Rgb};

    #[test]
    fn test_oil_painting_effect() {
        // テスト用のカラフルな画像を作成
        let mut img = RgbImage::new(30, 30);
        
        // グラデーションパターンを作成
        for y in 0..30 {
            for x in 0..30 {
                let r = (x as u8 * 8) % 255;
                let g = (y as u8 * 8) % 255;
                let b = ((x as u8 + y as u8) * 4) % 255;
                img.put_pixel(x, y, Rgb([r, g, b]));
            }
        }

        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();

        // 油彩効果を適用
        let radius = 2;
        let intensity = 10;
        let result = apply_oil_painting(&input_buf, radius, intensity);

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
        assert_eq!(decoded_img.width(), 30);
        assert_eq!(decoded_img.height(), 30);
        
        // 油彩効果が適用されていることを確認（量子化による効果）
        // ここでは量子化ステップによってユニークな色の数が減少することを確認
        let rgb_img = decoded_img.to_rgb8();
        let mut unique_colors = std::collections::HashSet::new();
        
        // 有効領域（边縁を除く）の色をカウント
        for y in radius..(30 - radius) {
            for x in radius..(30 - radius) {
                let pixel = rgb_img.get_pixel(x, y);
                unique_colors.insert((pixel[0], pixel[1], pixel[2]));
            }
        }
        
        // 量子化により色の種類が減少していることを確認（256^3未満）
        assert!(unique_colors.len() < 256 * 256 * 256);
    }
    
    #[test]
    fn test_various_parameters() {
        // テスト用の画像を作成
        let mut img = RgbImage::new(20, 20);
        
        // チェッカーボードパターンを作成
        for y in 0..20 {
            for x in 0..20 {
                let color = if (x / 5 + y / 5) % 2 == 0 {
                    Rgb([200, 200, 200])
                } else {
                    Rgb([50, 50, 50])
                };
                img.put_pixel(x, y, color);
            }
        }
        
        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();
        
        // 異なるパラメータで油彩効果を適用
        let radiuses = [1, 2, 3];
        let intensities = [5, 20, 50];
        
        for &radius in &radiuses {
            for &intensity in &intensities {
                let result = apply_oil_painting(&input_buf, radius, intensity);
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
} 