use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

/// モーションボカシを適用する
#[wasm_bindgen]
pub fn apply_motion_blur(input: &[u8], angle: f32, distance: f32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut motion_img = img.to_rgb8();
    let (width, height) = motion_img.dimensions();

    // 角度をラジアンに変換
    let angle_rad = angle.to_radians();
    let cos_angle = angle_rad.cos();
    let sin_angle = angle_rad.sin();

    // モーションボカシを適用（特定の方向へのぼかし）
    for y in 0..height {
        for x in 0..width {
            let mut r_sum = 0f32;
            let mut g_sum = 0f32;
            let mut b_sum = 0f32;
            let mut count = 0;

            // 指定された角度に沿ってぼかしを適用
            for d in 0..=(distance as i32) {
                let dx = (d as f32 * cos_angle) as i32;
                let dy = (d as f32 * sin_angle) as i32;
                let new_x = (x as i32 + dx).max(0).min(width as i32 - 1) as u32;
                let new_y = (y as i32 + dy).max(0).min(height as i32 - 1) as u32;

                let pixel = motion_img.get_pixel(new_x, new_y);
                r_sum += pixel[0] as f32;
                g_sum += pixel[1] as f32;
                b_sum += pixel[2] as f32;
                count += 1;
            }

            // 平均値を計算して適用
            let pixel = motion_img.get_pixel_mut(x, y);
            pixel[0] = (r_sum / count as f32) as u8;
            pixel[1] = (g_sum / count as f32) as u8;
            pixel[2] = (b_sum / count as f32) as u8;
        }
    }

    // PNGとして出力
    motion_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{RgbImage, Rgb};

    #[test]
    fn test_apply_motion_blur() {
        // テスト用のシンプルな画像を作成
        let mut img = RgbImage::new(20, 20);
        
        // 中央に赤い点を配置
        for y in 8..12 {
            for x in 8..12 {
                img.put_pixel(x, y, Rgb([255, 0, 0]));
            }
        }

        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();

        // モーションブラーを適用（0度方向、距離5ピクセル）
        let angle = 0.0;
        let distance = 5.0;
        let result = apply_motion_blur(&input_buf, angle, distance);

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
        
        // 別の角度でテスト
        let angle = 45.0;
        let result2 = apply_motion_blur(&input_buf, angle, distance);
        assert!(!result2.is_empty());
    }
    
    #[test]
    fn test_different_angles() {
        // テスト用の画像を作成
        let mut img = RgbImage::new(10, 10);
        // 中央に白い点を配置
        img.put_pixel(5, 5, Rgb([255, 255, 255]));
        
        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();
        
        // 異なる角度でモーションブラーを適用
        let angles = [0.0, 45.0, 90.0, 135.0, 180.0];
        for &angle in &angles {
            let result = apply_motion_blur(&input_buf, angle, 3.0);
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