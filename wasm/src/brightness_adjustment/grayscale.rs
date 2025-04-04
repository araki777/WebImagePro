use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

/// グレースケール変換
#[wasm_bindgen]
pub fn adjust_grayscale(input: &[u8]) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像の読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // グレースケール変換
    let img_gray = img.to_luma8();

    // グレースケール画像をPNGとして出力
    img_gray.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    #[test]
    fn test_adjust_grayscale() {
        // テスト用のカラフルな画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // 異なる色を設定
        img.put_pixel(0, 0, Rgb([255, 0, 0]));     // 赤
        img.put_pixel(0, 1, Rgb([0, 255, 0]));     // 緑
        img.put_pixel(1, 0, Rgb([0, 0, 255]));     // 青
        img.put_pixel(1, 1, Rgb([255, 255, 0]));   // 黄
        
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // グレースケール変換を適用
        let grayscale_bytes = adjust_grayscale(&buf);
        
        // 処理結果をデコード
        let grayscale_img = ImageReader::new(Cursor::new(grayscale_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap();
        
        // グレースケール画像に変換されていることを確認
        // グレースケール画像はLuma8またはRGB8だが、RGB8の場合は各チャネルの値が同じになる
        let grayscale_rgb = grayscale_img.to_rgb8();
        
        for y in 0..2 {
            for x in 0..2 {
                let pixel = grayscale_rgb.get_pixel(x, y);
                
                // R, G, Bの値が同じ（または非常に近い）ことを確認
                assert_eq!(pixel[0], pixel[1], "グレースケールでRとGの値が異なります at ({}, {})", x, y);
                assert_eq!(pixel[1], pixel[2], "グレースケールでGとBの値が異なります at ({}, {})", x, y);
                
                // 元の色に応じた輝度値になっていることを確認
                let original_pixel = img.get_pixel(x, y);
                let (r, g, b) = (original_pixel[0] as f32, original_pixel[1] as f32, original_pixel[2] as f32);
                
                // 一般的なグレースケール変換の重み付け（BT.709）
                let expected_luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b).round() as u8;
                
                println!("位置({}, {}) 元の色: [{}, {}, {}], グレースケール値: {}, 期待値: {}", 
                         x, y, original_pixel[0], original_pixel[1], original_pixel[2], pixel[0], expected_luminance);
                
                // 実装によって輝度計算方法が若干異なる場合があるため、許容範囲を設ける
                assert!((pixel[0] as i32 - expected_luminance as i32).abs() <= 10, 
                        "グレースケール値が期待から大きく外れています at ({}, {})", x, y);
            }
        }
    }

    #[test]
    fn test_adjust_grayscale_empty_input() {
        // 不正な入力（空のバイト配列）でエラーハンドリングをテスト
        let invalid_input: Vec<u8> = Vec::new();
        
        // panicすると期待（このテストはpanicが発生すると成功）
        let result = std::panic::catch_unwind(|| {
            let _ = adjust_grayscale(&invalid_input);
        });
        
        // panicが発生することを確認
        assert!(result.is_err(), "空の入力でpanicが発生しませんでした");
    }
} 