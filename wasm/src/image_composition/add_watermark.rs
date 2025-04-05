use image::ImageOutputFormat;
use image::io::Reader as ImageReader;
use wasm_bindgen::prelude::*;

/// ウォーターマークを追加
#[wasm_bindgen]
pub fn add_watermark(
    input: &[u8],
    watermark: &[u8],
    x: u32,
    y: u32,
    opacity: f32,
) -> Vec<u8> {
    let mut buf = Vec::new();
    let base = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();
    let watermark = ImageReader::new(std::io::Cursor::new(watermark))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut base_rgba = base.to_rgba8();
    let watermark_rgba = watermark.to_rgba8();
    let (width, height) = watermark_rgba.dimensions();

    for i in 0..width {
        for j in 0..height {
            let target_x = x + i;
            let target_y = y + j;
            if target_x < base_rgba.width() && target_y < base_rgba.height() {
                let pixel = base_rgba.get_pixel_mut(target_x, target_y);
                let wm_pixel = watermark_rgba.get_pixel(i, j);
                pixel[0] = (pixel[0] as f32 * (1.0 - opacity) + wm_pixel[0] as f32 * opacity) as u8;
                pixel[1] = (pixel[1] as f32 * (1.0 - opacity) + wm_pixel[1] as f32 * opacity) as u8;
                pixel[2] = (pixel[2] as f32 * (1.0 - opacity) + wm_pixel[2] as f32 * opacity) as u8;
                pixel[3] = pixel[3].max(wm_pixel[3]);
            }
        }
    }

    base_rgba.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();
    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba, RgbaImage, ImageFormat};

    #[test]
    fn test_add_watermark() {
        // ベース画像の作成（赤色の画像）
        let mut base_img: RgbaImage = ImageBuffer::new(200, 200);
        for x in 0..200 {
            for y in 0..200 {
                base_img.put_pixel(x, y, Rgba([255, 0, 0, 255]));
            }
        }
        
        // ウォーターマーク画像の作成（青色の小さい画像）
        let mut watermark_img: RgbaImage = ImageBuffer::new(50, 50);
        for x in 0..50 {
            for y in 0..50 {
                watermark_img.put_pixel(x, y, Rgba([0, 0, 255, 255]));
            }
        }
        
        // 画像をバイト配列に変換
        let mut base_buf = Vec::new();
        let mut watermark_buf = Vec::new();
        base_img.write_to(&mut std::io::Cursor::new(&mut base_buf), ImageFormat::Png).unwrap();
        watermark_img.write_to(&mut std::io::Cursor::new(&mut watermark_buf), ImageFormat::Png).unwrap();
        
        // テスト対象の関数を実行
        let x: u32 = 50;
        let y: u32 = 50;
        let opacity: f32 = 0.5;
        let result_buf = add_watermark(&base_buf, &watermark_buf, x, y, opacity);
        
        // 結果を検証
        let result_img = ImageReader::new(std::io::Cursor::new(result_buf))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        let result_rgba = result_img.to_rgba8();
        
        // ウォーターマークが適用されたエリアをチェック
        let test_x = x + 25; // ウォーターマークの中央
        let test_y = y + 25; // ウォーターマークの中央
        let pixel = result_rgba.get_pixel(test_x, test_y);
        
        // 50%の不透明度なので、赤と青が混ざって紫に近い色になるはず
        // 浮動小数点の丸め誤差を考慮して、厳密な値ではなく範囲でチェック
        assert!(pixel[0] >= 127 && pixel[0] <= 128, "赤成分は約50%になるべき"); // 255 * (1-0.5) + 0 * 0.5 = 127.5
        assert_eq!(pixel[1], 0, "緑成分は0のまま");
        assert!(pixel[2] >= 127 && pixel[2] <= 128, "青成分は約50%になるべき"); // 0 * (1-0.5) + 255 * 0.5 = 127.5
        assert_eq!(pixel[3], 255, "アルファ値は最大値を取るべき");
        
        // ウォーターマーク外のエリアをチェック
        let outside_x = 10;
        let outside_y = 10;
        let outside_pixel = result_rgba.get_pixel(outside_x, outside_y);
        
        // ウォーターマーク領域外は元の色のまま
        assert_eq!(outside_pixel[0], 255, "ウォーターマーク外は元の赤色のまま");
        assert_eq!(outside_pixel[1], 0, "ウォーターマーク外は元の緑色のまま");
        assert_eq!(outside_pixel[2], 0, "ウォーターマーク外は元の青色のまま");
        assert_eq!(outside_pixel[3], 255, "ウォーターマーク外は元のアルファ値のまま");
    }
} 