use image::ImageOutputFormat;
use image::io::Reader as ImageReader;
use wasm_bindgen::prelude::*;

/// 画像を合成（レイヤー）
#[wasm_bindgen]
pub fn composite(input: &[u8], overlay: &[u8], x: u32, y: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let base = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();
    let overlay = ImageReader::new(std::io::Cursor::new(overlay))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    let mut base_rgba = base.to_rgba8();
    let overlay_rgba = overlay.to_rgba8();
    let (width, height) = overlay_rgba.dimensions();

    for i in 0..width {
        for j in 0..height {
            let target_x = x + i;
            let target_y = y + j;
            if target_x < base_rgba.width() && target_y < base_rgba.height() {
                let pixel = base_rgba.get_pixel_mut(target_x, target_y);
                let overlay_pixel = overlay_rgba.get_pixel(i, j);
                let alpha = overlay_pixel[3] as f32 / 255.0;

                pixel[0] = (pixel[0] as f32 * (1.0 - alpha) + overlay_pixel[0] as f32 * alpha) as u8;
                pixel[1] = (pixel[1] as f32 * (1.0 - alpha) + overlay_pixel[1] as f32 * alpha) as u8;
                pixel[2] = (pixel[2] as f32 * (1.0 - alpha) + overlay_pixel[2] as f32 * alpha) as u8;
                pixel[3] = pixel[3].max(overlay_pixel[3]);
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
    fn test_composite() {
        // ベース画像の作成（緑色の画像）
        let mut base_img: RgbaImage = ImageBuffer::new(200, 200);
        for x in 0..200 {
            for y in 0..200 {
                base_img.put_pixel(x, y, Rgba([0, 255, 0, 255]));
            }
        }
        
        // オーバーレイ画像の作成（青色の半透明画像）
        let mut overlay_img: RgbaImage = ImageBuffer::new(50, 50);
        for x in 0..50 {
            for y in 0..50 {
                // 50%透明の青色
                overlay_img.put_pixel(x, y, Rgba([0, 0, 255, 128]));
            }
        }
        
        // 画像をバイト配列に変換
        let mut base_buf = Vec::new();
        let mut overlay_buf = Vec::new();
        base_img.write_to(&mut std::io::Cursor::new(&mut base_buf), ImageFormat::Png).unwrap();
        overlay_img.write_to(&mut std::io::Cursor::new(&mut overlay_buf), ImageFormat::Png).unwrap();
        
        // テスト対象の関数を実行
        let x: u32 = 75;
        let y: u32 = 75;
        let result_buf = composite(&base_buf, &overlay_buf, x, y);
        
        // 結果を検証
        let result_img = ImageReader::new(std::io::Cursor::new(result_buf))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        let result_rgba = result_img.to_rgba8();
        
        // オーバーレイが適用されたエリアをチェック
        let test_x = x + 25; // オーバーレイの中央
        let test_y = y + 25; // オーバーレイの中央
        let pixel = result_rgba.get_pixel(test_x, test_y);
        
        // 50%の不透明度なので、緑と青が混ざったカラーになるはず
        // 浮動小数点の丸め誤差を考慮して、厳密な値ではなく範囲でチェック
        assert_eq!(pixel[0], 0, "赤成分は0のまま");
        assert!(pixel[1] >= 126 && pixel[1] <= 128, "緑成分は約50%に減少するべき"); // 255 * (1-0.5) + 0 * 0.5 = 127.5
        assert!(pixel[2] >= 126 && pixel[2] <= 128, "青成分は約50%になるべき"); // 0 * (1-0.5) + 255 * 0.5 = 127.5
        assert_eq!(pixel[3], 255, "アルファ値は最大値を取るべき"); // max(255, 128) = 255
        
        // オーバーレイ外のエリアをチェック
        let outside_x = 10;
        let outside_y = 10;
        let outside_pixel = result_rgba.get_pixel(outside_x, outside_y);
        
        // オーバーレイ領域外は元の色のまま
        assert_eq!(outside_pixel[0], 0, "オーバーレイ外は元の赤色のまま");
        assert_eq!(outside_pixel[1], 255, "オーバーレイ外は元の緑色のまま");
        assert_eq!(outside_pixel[2], 0, "オーバーレイ外は元の青色のまま");
        assert_eq!(outside_pixel[3], 255, "オーバーレイ外は元のアルファ値のまま");
    }
} 