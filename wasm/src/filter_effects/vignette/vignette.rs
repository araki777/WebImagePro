use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

/// ビネット効果を適用する
#[wasm_bindgen]
pub fn apply_vignette(input: &[u8], strength: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut vignette_img = img.to_rgb8();
    let (width, height) = vignette_img.dimensions();

    for y in 0..height {
        for x in 0..width {
            let dx = (x as f32 - width as f32 / 2.0) / (width as f32 / 2.0);
            let dy = (y as f32 - height as f32 / 2.0) / (height as f32 / 2.0);
            let distance = (dx * dx + dy * dy).sqrt();
            let factor = (1.0 - distance * strength).max(0.0);

            let pixel = vignette_img.get_pixel_mut(x, y);
            pixel[0] = (pixel[0] as f32 * factor) as u8;
            pixel[1] = (pixel[1] as f32 * factor) as u8;
            pixel[2] = (pixel[2] as f32 * factor) as u8;
        }
    }

    // PNGとして出力
    vignette_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{RgbImage, Rgb};

    #[test]
    fn test_vignette_effect() {
        // テスト用の均一な画像を作成
        let mut img = RgbImage::new(40, 40);
        
        // すべてのピクセルを白に設定
        for y in 0..40 {
            for x in 0..40 {
                img.put_pixel(x, y, Rgb([255, 255, 255]));
            }
        }

        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();

        // ビネット効果を適用
        let strength = 1.0;
        let result = apply_vignette(&input_buf, strength);

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
        assert_eq!(decoded_img.width(), 40);
        assert_eq!(decoded_img.height(), 40);
        
        // ビネット効果が適用されていることを確認（縁が暗く中央が明るいはず）
        let rgb_img = decoded_img.to_rgb8();
        
        // 中央のピクセルが端のピクセルより明るいことを確認
        let center_pixel = rgb_img.get_pixel(20, 20);
        let corner_pixel = rgb_img.get_pixel(0, 0);
        
        assert!(center_pixel[0] > corner_pixel[0]);
        assert!(center_pixel[1] > corner_pixel[1]);
        assert!(center_pixel[2] > corner_pixel[2]);
    }
    
    #[test]
    fn test_various_strengths() {
        // テスト用の画像を作成
        let mut img = RgbImage::new(20, 20);
        for y in 0..20 {
            for x in 0..20 {
                img.put_pixel(x, y, Rgb([200, 200, 200]));
            }
        }
        
        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();
        
        // 異なる強度でビネット効果を適用
        let strengths = [0.5, 1.0, 1.5, 2.0];
        
        for &strength in &strengths {
            let result = apply_vignette(&input_buf, strength);
            assert!(!result.is_empty());
            
            // デコードできることを確認
            let decoded = ImageReader::new(std::io::Cursor::new(&result))
                .with_guessed_format()
                .unwrap()
                .decode();
            assert!(decoded.is_ok());
            
            // 強度が高いほど暗い領域が増えることを確認できるが、
            // ここではデコードのみを確認
        }
    }
} 