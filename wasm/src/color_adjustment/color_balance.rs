use wasm_bindgen::prelude::*;
use std::io::Cursor;
use image::io::Reader as ImageReader;
use image::{ImageOutputFormat, Rgb};

/// カラーバランス調整
#[wasm_bindgen]
pub fn adjust_color_balance(input: &[u8], red_factor: f32, green_factor: f32, blue_factor: f32) -> Vec<u8> {
    let mut buf = Vec::new();

    // 画像の読み込み
    let img = ImageReader::new(Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 画像をRGB8に変換
    let mut img_rgb = img.to_rgb8();

    // カラーバランス調整
    for pixel in img_rgb.pixels_mut() {
        let r = (pixel.0[0] as f32 * red_factor).clamp(0.0, 255.0) as u8;
        let g = (pixel.0[1] as f32 * green_factor).clamp(0.0, 255.0) as u8;
        let b = (pixel.0[2] as f32 * blue_factor).clamp(0.0, 255.0) as u8;

        *pixel = Rgb([r, g, b]);
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
    fn test_adjust_color_balance() {
        // テスト用の小さな画像を作成
        let mut img: RgbImage = ImageBuffer::new(2, 2);
        
        // RGB成分がすべて等しい中間色
        let r = 100u8;
        let g = 100u8;
        let b = 100u8;
        
        img.put_pixel(0, 0, Rgb([r, g, b]));
        img.put_pixel(0, 1, Rgb([r, g, b]));
        img.put_pixel(1, 0, Rgb([r, g, b]));
        img.put_pixel(1, 1, Rgb([r, g, b]));
        
        // 画像をPNG形式のバイト配列に変換
        let mut buf = Vec::new();
        img.write_to(&mut Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();
        
        // 赤を強調するカラーバランス調整
        let red_emphasis_bytes = adjust_color_balance(&buf, 1.5, 1.0, 1.0);
        
        // 緑を弱めるカラーバランス調整
        let green_reduced_bytes = adjust_color_balance(&buf, 1.0, 0.5, 1.0);
        
        // 青を強調して他を弱めるカラーバランス調整
        let blue_emphasis_bytes = adjust_color_balance(&buf, 0.8, 0.8, 1.5);
        
        // 処理結果をデコード
        let red_img = ImageReader::new(Cursor::new(red_emphasis_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
            
        let green_img = ImageReader::new(Cursor::new(green_reduced_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
            
        let blue_img = ImageReader::new(Cursor::new(blue_emphasis_bytes))
            .with_guessed_format().unwrap()
            .decode().unwrap()
            .to_rgb8();
        
        // 赤強調のテスト
        let red_pixel = red_img.get_pixel(0, 0);
        assert!(red_pixel[0] > red_pixel[1], "赤が強調されていません");
        assert!(red_pixel[0] > red_pixel[2], "赤が強調されていません");
        assert_eq!(red_pixel[1], red_pixel[2], "緑と青のバランスが変わっています");
        assert_eq!(red_pixel[0], (r as f32 * 1.5) as u8, "赤の係数が正しく適用されていません");
        
        // 緑弱化のテスト
        let green_pixel = green_img.get_pixel(0, 0);
        assert_eq!(green_pixel[0], r, "赤が変化しています");
        assert!(green_pixel[1] < green_pixel[0], "緑が弱化されていません");
        assert_eq!(green_pixel[2], b, "青が変化しています");
        assert_eq!(green_pixel[1], (g as f32 * 0.5) as u8, "緑の係数が正しく適用されていません");
        
        // 青強調・他弱化のテスト
        let blue_pixel = blue_img.get_pixel(0, 0);
        assert!(blue_pixel[2] > blue_pixel[0], "青が強調されていません");
        assert!(blue_pixel[2] > blue_pixel[1], "青が強調されていません");
        assert_eq!(blue_pixel[0], (r as f32 * 0.8) as u8, "赤の係数が正しく適用されていません");
        assert_eq!(blue_pixel[1], (g as f32 * 0.8) as u8, "緑の係数が正しく適用されていません");
        assert_eq!(blue_pixel[2], (b as f32 * 1.5) as u8, "青の係数が正しく適用されていません");
    }
} 