use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, imageops};

/// 画像の明るさを調整する
#[wasm_bindgen]
pub fn adjust_brightness(input: &[u8], brightness: i32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 明るさ調整（正の値で明るく、負の値で暗くなる）
    let adjusted_img = imageops::brighten(&img, brightness);

    // PNGとして出力
    adjusted_img.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    #[test]
    fn test_adjust_brightness_positive() {
        // テスト用の小さな画像を作成 (2x2ピクセル)
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // 画像に値をセット (すべて同じ中間色)
        let original_color = 100u8;
        img.put_pixel(0, 0, Rgb([original_color, original_color, original_color]));
        img.put_pixel(0, 1, Rgb([original_color, original_color, original_color]));
        img.put_pixel(1, 0, Rgb([original_color, original_color, original_color]));
        img.put_pixel(1, 1, Rgb([original_color, original_color, original_color]));
        
        // 画像をPNGとしてバイト配列に変換
        let mut buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // 明るさを上げる処理をテスト (+50)
        let brightness_value = 50;
        let brightened_bytes = adjust_brightness(&buf, brightness_value);
        
        // 処理結果をデコード
        let brightened_img = ImageReader::new(std::io::Cursor::new(brightened_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // 明るさが上がっていることを検証
        let pixel = brightened_img.get_pixel(0, 0);
        assert!(pixel[0] > original_color, "明るさが上がっていません");
        assert!(pixel[1] > original_color, "明るさが上がっていません");
        assert!(pixel[2] > original_color, "明るさが上がっていません");
    }

    #[test]
    fn test_adjust_brightness_negative() {
        // テスト用の小さな画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        let original_color = 150u8;
        img.put_pixel(0, 0, Rgb([original_color, original_color, original_color]));
        img.put_pixel(0, 1, Rgb([original_color, original_color, original_color]));
        img.put_pixel(1, 0, Rgb([original_color, original_color, original_color]));
        img.put_pixel(1, 1, Rgb([original_color, original_color, original_color]));
        
        let mut buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // 明るさを下げる処理をテスト (-50)
        let brightness_value = -50;
        let darkened_bytes = adjust_brightness(&buf, brightness_value);
        
        let darkened_img = ImageReader::new(std::io::Cursor::new(darkened_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // 明るさが下がっていることを検証
        let pixel = darkened_img.get_pixel(0, 0);
        assert!(pixel[0] < original_color, "明るさが下がっていません");
        assert!(pixel[1] < original_color, "明るさが下がっていません");
        assert!(pixel[2] < original_color, "明るさが下がっていません");
    }

    #[test]
    fn test_adjust_brightness_out_of_bounds() {
        // テスト用の小さな画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // 極端な値を設定（すでに最大値の場合）
        let max_value = 255u8;
        img.put_pixel(0, 0, Rgb([max_value, max_value, max_value]));
        img.put_pixel(0, 1, Rgb([max_value, max_value, max_value]));
        img.put_pixel(1, 0, Rgb([max_value, max_value, max_value]));
        img.put_pixel(1, 1, Rgb([max_value, max_value, max_value]));
        
        let mut buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // 明るさをさらに上げる（クリッピングが発生するケース）
        let brightness_value = 50;
        let brightened_bytes = adjust_brightness(&buf, brightness_value);
        
        let brightened_img = ImageReader::new(std::io::Cursor::new(brightened_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // 値が255をオーバーフローせず、最大値にクリッピングされることを確認
        let pixel = brightened_img.get_pixel(0, 0);
        assert_eq!(pixel[0], 255, "最大値を超えてオーバーフローしています");
        assert_eq!(pixel[1], 255, "最大値を超えてオーバーフローしています");
        assert_eq!(pixel[2], 255, "最大値を超えてオーバーフローしています");
    }

    #[test]
    fn test_adjust_brightness_invalid_input() {
        // 不正な入力（空のバイト配列）でエラーハンドリングをテスト
        let invalid_input: Vec<u8> = Vec::new();
        
        // panicすると期待（このテストはpanicが発生すると成功）
        let result = std::panic::catch_unwind(|| {
            let _ = adjust_brightness(&invalid_input, 0);
        });
        
        // panicが発生することを確認
        assert!(result.is_err(), "空の入力でpanicが発生しませんでした");
    }
} 