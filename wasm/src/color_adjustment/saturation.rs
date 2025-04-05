use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, Rgb};
use crate::color_conversion::{rgb_to_hsv, hsv_to_rgb};

/// 画像の彩度を調整する
#[wasm_bindgen]
pub fn adjust_saturation(input: &[u8], saturation: f32) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像を読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 画像をRGB8に変換
    let mut img_rgb = img.to_rgb8();

    // 各ピクセルに対して彩度調整を行う
    for pixel in img_rgb.pixels_mut() {
        let (r, g, b) = (pixel.0[0], pixel.0[1], pixel.0[2]);

        // RGBをHSB（HSV）に変換
        let (h, s, v) = rgb_to_hsv(r as f32, g as f32, b as f32);

        // 彩度を調整（0~1で調整するため、saturationに対して操作）
        let new_s = (s * saturation).min(1.0).max(0.0);

        // 調整したHSBからRGBに戻す
        let (new_r, new_g, new_b) = hsv_to_rgb(h, new_s, v);

        // ピクセルの色を更新
        *pixel = Rgb([new_r as u8, new_g as u8, new_b as u8]);
    }

    // PNGとして出力
    img_rgb.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, RgbImage, Rgb};

    #[test]
    fn test_adjust_saturation() {
        // テスト用の小さな画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // 中程度の彩度を持つ色を設定
        let r = 100u8;
        let g = 150u8;
        let b = 200u8;
        
        img.put_pixel(0, 0, Rgb([r, g, b]));
        img.put_pixel(0, 1, Rgb([r, g, b]));
        img.put_pixel(1, 0, Rgb([r, g, b]));
        img.put_pixel(1, 1, Rgb([r, g, b]));
        
        // 画像をPNG形式のバイト配列に変換
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();
        
        // 彩度を上げるテスト（2倍）
        let increased_saturation_factor = 2.0;
        let increased_saturation_bytes = adjust_saturation(&buf, increased_saturation_factor);
        
        // 彩度を下げるテスト（0.5倍）
        let decreased_saturation_factor = 0.5;
        let decreased_saturation_bytes = adjust_saturation(&buf, decreased_saturation_factor);
        
        // 処理結果をデコード
        let increased_img = ImageReader::new(Cursor::new(increased_saturation_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
            
        let decreased_img = ImageReader::new(Cursor::new(decreased_saturation_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // 元のピクセルのHSV値を取得
        let (h, s, v) = rgb_to_hsv(r as f32, g as f32, b as f32);
        
        // 彩度を上げた結果を確認
        let increased_pixel = increased_img.get_pixel(0, 0);
        let (inc_h, inc_s, inc_v) = rgb_to_hsv(
            increased_pixel[0] as f32, 
            increased_pixel[1] as f32, 
            increased_pixel[2] as f32
        );
        
        // 彩度を下げた結果を確認
        let decreased_pixel = decreased_img.get_pixel(0, 0);
        let (dec_h, dec_s, dec_v) = rgb_to_hsv(
            decreased_pixel[0] as f32, 
            decreased_pixel[1] as f32, 
            decreased_pixel[2] as f32
        );
        
        // 彩度が適切に変更されていることを確認
        assert!(inc_s > s, "彩度が上がっていません");
        assert!(dec_s < s, "彩度が下がっていません");
        
        // 色相と明度はほぼ変わらないことを確認（浮動小数点の誤差を考慮）
        assert!((inc_h - h).abs() < 0.1, "色相が変化しています");
        assert!((inc_v - v).abs() < 0.1, "明度が変化しています");
        
        assert!((dec_h - h).abs() < 0.1, "色相が変化しています");
        assert!((dec_v - v).abs() < 0.1, "明度が変化しています");
    }
} 