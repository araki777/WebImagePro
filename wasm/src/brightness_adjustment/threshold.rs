use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, Luma};

/// 画像の白黒変換（2値化）
#[wasm_bindgen]
pub fn adjust_threshold(input: &[u8], threshold: u8) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像の読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 画像をグレースケールに変換
    let img_gray = img.to_luma8();

    let mut img_binary = img_gray.clone();

    for pixel in img_binary.pixels_mut() {
        let gray_value = pixel.0[0];
        let new_value = if gray_value >= threshold { 255 } else { 0 };
        *pixel = Luma([new_value]);
    }

    // PNGとして出力
    img_binary.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    #[test]
    fn test_adjust_threshold() {
        // グレースケールの階調を持つ画像を作成
        let mut img: RgbImage = ImageBuffer::new(4, 1);
        
        img.put_pixel(0, 0, Rgb([50, 50, 50]));    // 暗い
        img.put_pixel(1, 0, Rgb([100, 100, 100])); // やや暗い
        img.put_pixel(2, 0, Rgb([150, 150, 150])); // やや明るい
        img.put_pixel(3, 0, Rgb([200, 200, 200])); // 明るい
        
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // 閾値処理（2値化）を適用 - 閾値を中間値に設定
        let threshold_value = 128;
        let threshold_bytes = adjust_threshold(&buf, threshold_value);
        
        // 処理結果をデコード
        let threshold_img = ImageReader::new(Cursor::new(threshold_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap();
        
        // 画像をグレースケールとして読み込み
        let luma_img = threshold_img.to_luma8();
        
        // 閾値より低い値は0に、高い値は255になっていることを確認
        let dark_pixel1 = luma_img.get_pixel(0, 0);
        let dark_pixel2 = luma_img.get_pixel(1, 0);
        let bright_pixel1 = luma_img.get_pixel(2, 0);
        let bright_pixel2 = luma_img.get_pixel(3, 0);
        
        // 元の値が閾値未満のピクセルは0になる
        assert_eq!(dark_pixel1[0], 0, "閾値未満のピクセルが0になっていません");
        assert_eq!(dark_pixel2[0], 0, "閾値未満のピクセルが0になっていません");
        
        // 元の値が閾値以上のピクセルは255になる
        assert_eq!(bright_pixel1[0], 255, "閾値以上のピクセルが255になっていません");
        assert_eq!(bright_pixel2[0], 255, "閾値以上のピクセルが255になっていません");
    }

    #[test]
    fn test_adjust_threshold_invalid_input() {
        // 不正な入力（空のバイト配列）でエラーハンドリングをテスト
        let invalid_input: Vec<u8> = Vec::new();
        
        // panicすると期待（このテストはpanicが発生すると成功）
        let result = std::panic::catch_unwind(|| {
            let _ = adjust_threshold(&invalid_input, 128);
        });
        
        // panicが発生することを確認
        assert!(result.is_err(), "空の入力でpanicが発生しませんでした");
    }

    #[test]
    fn test_adjust_threshold_edge_values() {
        // テスト用の画像を作成
        let mut img: RgbImage = ImageBuffer::new(3, 1);
        
        // 境界値を含む画像
        img.put_pixel(0, 0, Rgb([0, 0, 0]));       // 最小値
        img.put_pixel(1, 0, Rgb([128, 128, 128])); // 閾値と同じ値
        img.put_pixel(2, 0, Rgb([255, 255, 255])); // 最大値
        
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // 閾値を128に設定
        let threshold_value = 128;
        let threshold_bytes = adjust_threshold(&buf, threshold_value);
        
        // 処理結果をデコード
        let threshold_img = ImageReader::new(Cursor::new(threshold_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_luma8();
        
        // 閾値処理結果を確認
        let min_pixel = threshold_img.get_pixel(0, 0);
        let threshold_pixel = threshold_img.get_pixel(1, 0);
        let max_pixel = threshold_img.get_pixel(2, 0);
        
        // 最小値は0になる
        assert_eq!(min_pixel[0], 0, "最小値(0)が正しく処理されていません");
        
        // 閾値と同じ値は255になる（閾値「以上」が白になる仕様）
        assert_eq!(threshold_pixel[0], 255, "閾値と同じ値(128)が正しく処理されていません");
        
        // 最大値は255になる
        assert_eq!(max_pixel[0], 255, "最大値(255)が正しく処理されていません");
    }

    #[test]
    fn test_adjust_threshold_extreme_values() {
        // テスト用の画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // 均一な中間色
        let gray_value = 128u8;
        img.put_pixel(0, 0, Rgb([gray_value, gray_value, gray_value]));
        img.put_pixel(0, 1, Rgb([gray_value, gray_value, gray_value]));
        img.put_pixel(1, 0, Rgb([gray_value, gray_value, gray_value]));
        img.put_pixel(1, 1, Rgb([gray_value, gray_value, gray_value]));
        
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), image::ImageOutputFormat::Png).unwrap();
        
        // 閾値0（すべて白になるはず）
        let min_threshold_bytes = adjust_threshold(&buf, 0);
        let min_threshold_img = ImageReader::new(Cursor::new(min_threshold_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_luma8();
            
        // 閾値255（すべて黒になるはず）
        let max_threshold_bytes = adjust_threshold(&buf, 255);
        let max_threshold_img = ImageReader::new(Cursor::new(max_threshold_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_luma8();
        
        // 閾値0ではすべてのピクセルが白(255)になる
        assert_eq!(min_threshold_img.get_pixel(0, 0)[0], 255, "閾値0でピクセルが白になっていません");
        
        // 閾値255ではすべてのピクセルが黒(0)になる
        assert_eq!(max_threshold_img.get_pixel(0, 0)[0], 0, "閾値255でピクセルが黒になっていません");
    }
} 