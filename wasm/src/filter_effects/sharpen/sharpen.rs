use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, imageops};

/// シャープ化を適用する
#[wasm_bindgen]
pub fn apply_sharpen(input: &[u8], sigma: f32, threshold: i32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // シャープ化を適用
    let sharpened_img = imageops::unsharpen(&img, sigma, threshold);

    // PNGとして出力
    sharpened_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{RgbImage, Rgb};

    #[test]
    fn test_apply_sharpen() {
        // テスト用のシンプルな画像を作成
        let mut img = RgbImage::new(20, 20);
        
        // 背景をグレーに設定
        for y in 0..20 {
            for x in 0..20 {
                img.put_pixel(x, y, Rgb([128, 128, 128]));
            }
        }
        
        // 中央にボケた円を描画
        for y in 5..15 {
            for x in 5..15 {
                let dx = x as f32 - 10.0;
                let dy = y as f32 - 10.0;
                let distance = (dx * dx + dy * dy).sqrt();
                if distance < 5.0 {
                    let intensity = ((5.0 - distance) / 5.0 * 200.0) as u8;
                    img.put_pixel(x, y, Rgb([intensity, intensity, intensity]));
                }
            }
        }

        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();

        // シャープ化を適用
        let sigma = 1.0;
        let threshold = 3;
        let result = apply_sharpen(&input_buf, sigma, threshold);

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
    fn test_various_parameters() {
        // テスト用の画像を作成
        let mut img = RgbImage::new(10, 10);
        // ぼやけたパターンを作成
        for y in 0..10 {
            for x in 0..10 {
                let value = (x as u8 * 25) % 255;
                img.put_pixel(x, y, Rgb([value, value, value]));
            }
        }
        
        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();
        
        // 異なるパラメータでシャープ化を適用
        let sigmas = [0.5, 1.0, 2.0];
        let thresholds = [1, 3, 5];
        
        for &sigma in &sigmas {
            for &threshold in &thresholds {
                let result = apply_sharpen(&input_buf, sigma, threshold);
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