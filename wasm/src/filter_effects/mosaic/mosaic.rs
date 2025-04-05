use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

/// モザイク効果を適用する
#[wasm_bindgen]
pub fn apply_mosaic(input: &[u8], block_size: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut mosaic_img = img.to_rgb8();
    let (width, height) = mosaic_img.dimensions();

    for y in (0..height).step_by(block_size as usize) {
        for x in (0..width).step_by(block_size as usize) {
            let mut r_sum = 0u32;
            let mut g_sum = 0u32;
            let mut b_sum = 0u32;
            let mut count = 0u32;

            // ブロック内の平均色を計算
            for by in y..(y + block_size).min(height) {
                for bx in x..(x + block_size).min(width) {
                    let pixel = mosaic_img.get_pixel(bx, by);
                    r_sum += pixel[0] as u32;
                    g_sum += pixel[1] as u32;
                    b_sum += pixel[2] as u32;
                    count += 1;
                }
            }

            // 平均色をブロック全体に適用
            let avg_r = (r_sum / count) as u8;
            let avg_g = (g_sum / count) as u8;
            let avg_b = (b_sum / count) as u8;

            for by in y..(y + block_size).min(height) {
                for bx in x..(x + block_size).min(width) {
                    let pixel = mosaic_img.get_pixel_mut(bx, by);
                    pixel[0] = avg_r;
                    pixel[1] = avg_g;
                    pixel[2] = avg_b;
                }
            }
        }
    }

    // PNGとして出力
    mosaic_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{RgbImage, Rgb};

    #[test]
    fn test_mosaic_effect() {
        // テスト用のグラデーション画像を作成
        let mut img = RgbImage::new(20, 20);
        
        // グラデーションパターンを作成
        for y in 0..20 {
            for x in 0..20 {
                let r = (x as u8 * 12) % 255;
                let g = (y as u8 * 12) % 255;
                let b = ((x as u8 + y as u8) * 6) % 255;
                img.put_pixel(x, y, Rgb([r, g, b]));
            }
        }

        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();

        // モザイク効果を適用（ブロックサイズ4）
        let block_size = 4;
        let result = apply_mosaic(&input_buf, block_size);

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
        
        // モザイク効果が適用されていることを確認（ブロック内の色が同じであることを確認）
        let rgb_img = decoded_img.to_rgb8();
        
        // ブロックごとに色が同じであることを確認
        for by in (0..20).step_by(block_size as usize) {
            for bx in (0..20).step_by(block_size as usize) {
                let reference_pixel = rgb_img.get_pixel(bx, by);
                
                // ブロック内の各ピクセルを確認
                for y in by..((by + block_size).min(20)) {
                    for x in bx..((bx + block_size).min(20)) {
                        let pixel = rgb_img.get_pixel(x, y);
                        assert_eq!(pixel[0], reference_pixel[0]);
                        assert_eq!(pixel[1], reference_pixel[1]);
                        assert_eq!(pixel[2], reference_pixel[2]);
                    }
                }
            }
        }
    }
    
    #[test]
    fn test_various_block_sizes() {
        // テスト用の画像を作成
        let mut img = RgbImage::new(30, 30);
        
        // 単純なパターンを作成
        for y in 0..30 {
            for x in 0..30 {
                let value = ((x + y) % 255) as u8;
                img.put_pixel(x, y, Rgb([value, value, value]));
            }
        }
        
        // 画像をPNGにエンコード
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageOutputFormat::Png).unwrap();
        
        // 異なるブロックサイズでモザイク効果を適用
        let block_sizes = [2, 5, 10];
        
        for &block_size in &block_sizes {
            let result = apply_mosaic(&input_buf, block_size);
            assert!(!result.is_empty());
            
            // デコードできることを確認
            let decoded = ImageReader::new(std::io::Cursor::new(&result))
                .with_guessed_format()
                .unwrap()
                .decode();
            assert!(decoded.is_ok());
            
            // ブロックサイズが大きいほどブロックの数が少なくなることを確認
            // ここではデコードの成功のみ確認
        }
    }
} 