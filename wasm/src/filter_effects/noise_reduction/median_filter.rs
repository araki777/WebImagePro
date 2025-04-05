use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

/// ノイズ除去を適用する
#[wasm_bindgen]
pub fn apply_noise_reduction(input: &[u8], radius: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut denoised_img = img.to_rgb8();
    let (width, height) = denoised_img.dimensions();

    // メディアンフィルターを適用
    for y in radius..height-radius {
        for x in radius..width-radius {
            let mut r_values = Vec::new();
            let mut g_values = Vec::new();
            let mut b_values = Vec::new();

            // 周辺ピクセルの値を収集
            for dy in -(radius as i32)..=(radius as i32) {
                for dx in -(radius as i32)..=(radius as i32) {
                    let pixel = denoised_img.get_pixel((x as i32 + dx) as u32, (y as i32 + dy) as u32);
                    r_values.push(pixel[0]);
                    g_values.push(pixel[1]);
                    b_values.push(pixel[2]);
                }
            }

            // 各チャンネルの中央値を計算
            r_values.sort();
            g_values.sort();
            b_values.sort();

            let median_r = r_values[r_values.len() / 2];
            let median_g = g_values[g_values.len() / 2];
            let median_b = b_values[b_values.len() / 2];

            // 中央値を適用
            let pixel = denoised_img.get_pixel_mut(x, y);
            pixel[0] = median_r;
            pixel[1] = median_g;
            pixel[2] = median_b;
        }
    }

    // PNGとして出力
    denoised_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{RgbImage, Rgb};
    use rand::Rng;

    #[test]
    fn test_noise_reduction() {
        // テスト用のノイズがある画像を作成
        let mut img = RgbImage::new(30, 30);
        let mut rng = rand::thread_rng();
        
        // まず均一な色のベースを作成
        for y in 0..30 {
            for x in 0..30 {
                img.put_pixel(x, y, Rgb([100, 100, 100]));
            }
        }
        
        // ランダムなノイズを追加
        for _ in 0..50 {
            let x = rng.gen_range(0..30);
            let y = rng.gen_range(0..30);
            let r = rng.gen_range(0..255);
            let g = rng.gen_range(0..255);
            let b = rng.gen_range(0..255);
            img.put_pixel(x, y, Rgb([r, g, b]));
        }

        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();

        // ノイズ除去を適用
        let radius = 1;
        let result = apply_noise_reduction(&input_buf, radius);

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
    }
    
    #[test]
    fn test_various_radius() {
        // テスト用の画像を作成
        let mut img = RgbImage::new(20, 20);
        let mut rng = rand::thread_rng();
        
        // ノイズの多い画像を作成
        for y in 0..20 {
            for x in 0..20 {
                let r = rng.gen_range(0..255);
                let g = rng.gen_range(0..255);
                let b = rng.gen_range(0..255);
                img.put_pixel(x, y, Rgb([r, g, b]));
            }
        }
        
        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();
        
        // 異なる半径でノイズ除去を適用
        let radii = [1, 2, 3];
        
        for &radius in &radii {
            let result = apply_noise_reduction(&input_buf, radius);
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