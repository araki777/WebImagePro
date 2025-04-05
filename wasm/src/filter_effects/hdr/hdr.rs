use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

/// HDR効果を適用する
#[wasm_bindgen]
pub fn apply_hdr(input: &[u8], strength: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut hdr_img = img.to_rgb8();
    let (width, height) = hdr_img.dimensions();

    // トーンマッピング用のパラメータ
    let exposure = 1.0 + strength * 0.5; // 露出調整
    let gamma = 1.0 + strength * 0.3;     // ガンマ調整
    let contrast = 1.0 + strength * 0.2;  // コントラスト調整

    for y in 0..height {
        for x in 0..width {
            let pixel = hdr_img.get_pixel_mut(x, y);
            let r = pixel[0] as f32;
            let g = pixel[1] as f32;
            let b = pixel[2] as f32;

            // HDR効果の適用（トーンマッピング）
            let hdr_r = ((r / 255.0 * exposure).powf(1.0 / gamma) * contrast * 255.0).min(255.0) as u8;
            let hdr_g = ((g / 255.0 * exposure).powf(1.0 / gamma) * contrast * 255.0).min(255.0) as u8;
            let hdr_b = ((b / 255.0 * exposure).powf(1.0 / gamma) * contrast * 255.0).min(255.0) as u8;

            pixel[0] = hdr_r;
            pixel[1] = hdr_g;
            pixel[2] = hdr_b;
        }
    }

    // PNGとして出力
    hdr_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{RgbImage, Rgb};

    #[test]
    fn test_hdr_effect() {
        // テスト用の暗い画像を作成
        let mut img = RgbImage::new(20, 20);
        
        // 暗めのグラデーションを作成
        for y in 0..20 {
            for x in 0..20 {
                let value = (x as u8 + y as u8) * 3; // 最大値は 114 (0-255の範囲内)
                img.put_pixel(x, y, Rgb([value, value, value]));
            }
        }

        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();

        // HDR効果を適用
        let strength = 1.0;
        let result = apply_hdr(&input_buf, strength);

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
        
        // HDR効果が適用されていることを確認（明るさの確認）
        let rgb_img = decoded_img.to_rgb8();
        let original_max_value = 114; // 元画像の最大値
        
        // 最も明るいピクセルのRGB値を取得
        let brightest_pixel = rgb_img.get_pixel(19, 19);
        
        // HDR効果により明るくなっていることを確認
        assert!(brightest_pixel[0] > original_max_value);
    }
    
    #[test]
    fn test_various_strengths() {
        // テスト用の画像を作成
        let mut img = RgbImage::new(10, 10);
        
        // 中間色の画像を作成
        for y in 0..10 {
            for x in 0..10 {
                img.put_pixel(x, y, Rgb([128, 128, 128]));
            }
        }
        
        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();
        
        // 異なる強度でHDR効果を適用
        let strengths = [0.5, 1.0, 2.0, 3.0];
        let mut previous_brightness = 0;
        
        for &strength in &strengths {
            let result = apply_hdr(&input_buf, strength);
            assert!(!result.is_empty());
            
            // デコードできることを確認
            let decoded = ImageReader::new(std::io::Cursor::new(&result))
                .with_guessed_format()
                .unwrap()
                .decode();
            assert!(decoded.is_ok());
            
            // 強度が高いほど明るくなることを確認
            let rgb_img = decoded.unwrap().to_rgb8();
            let pixel = rgb_img.get_pixel(5, 5);
            let current_brightness = pixel[0] as i32 + pixel[1] as i32 + pixel[2] as i32;
            
            if previous_brightness > 0 {
                assert!(current_brightness >= previous_brightness);
            }
            previous_brightness = current_brightness;
        }
    }
} 