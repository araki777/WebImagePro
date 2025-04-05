use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

// 画像の反転
#[wasm_bindgen]
pub fn flip_image(input: &[u8], horizontal: bool) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 反転処理
    let flipped_image = if horizontal {
        img.fliph()
    } else {
        img.flipv()
    };

    // PNGとして出力
    flipped_image.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba, RgbaImage, ImageFormat, GenericImageView};

    #[test]
    fn test_flip_image() {
        // テスト用の画像データを作成（2分割の画像）
        let width = 100;
        let height = 100;
        let mut img: RgbaImage = ImageBuffer::new(width, height);
        
        // 左側を赤、右側を青に
        for x in 0..width {
            for y in 0..height {
                if x < width / 2 {
                    // 左側（赤）
                    img.put_pixel(x, y, Rgba([255, 0, 0, 255]));
                } else {
                    // 右側（青）
                    img.put_pixel(x, y, Rgba([0, 0, 255, 255]));
                }
            }
        }
        
        // 画像をバイト配列に変換
        let mut input_buf = Vec::new();
        img.write_to(&mut std::io::Cursor::new(&mut input_buf), ImageFormat::Png).unwrap();
        
        // テスト1: 水平反転
        let result_buf_h = flip_image(&input_buf, true);
        let result_img_h = ImageReader::new(std::io::Cursor::new(result_buf_h))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        // 水平反転後のサイズは変わらないはず
        let (width_h, height_h) = result_img_h.dimensions();
        assert_eq!(width_h, width, "水平反転後も幅は変わらないはず");
        assert_eq!(height_h, height, "水平反転後も高さは変わらないはず");
        
        // 水平反転後は左右が入れ替わるはず
        let result_rgba_h = result_img_h.to_rgba8();
        
        // 左側が青になっているか確認
        let left_pixel = result_rgba_h.get_pixel(width_h / 4, height_h / 2);
        assert_eq!(left_pixel[0], 0, "水平反転後の左側は青色になるはず");
        assert_eq!(left_pixel[1], 0, "水平反転後の左側は青色になるはず");
        assert_eq!(left_pixel[2], 255, "水平反転後の左側は青色になるはず");
        
        // 右側が赤になっているか確認
        let right_pixel = result_rgba_h.get_pixel(3 * width_h / 4, height_h / 2);
        assert_eq!(right_pixel[0], 255, "水平反転後の右側は赤色になるはず");
        assert_eq!(right_pixel[1], 0, "水平反転後の右側は赤色になるはず");
        assert_eq!(right_pixel[2], 0, "水平反転後の右側は赤色になるはず");
        
        // テスト2: 垂直反転
        // 新しい画像を作成（上下で分割）
        let mut img_v: RgbaImage = ImageBuffer::new(width, height);
        for x in 0..width {
            for y in 0..height {
                if y < height / 2 {
                    // 上側（緑）
                    img_v.put_pixel(x, y, Rgba([0, 255, 0, 255]));
                } else {
                    // 下側（黄）
                    img_v.put_pixel(x, y, Rgba([255, 255, 0, 255]));
                }
            }
        }
        
        // 画像をバイト配列に変換
        let mut input_buf_v = Vec::new();
        img_v.write_to(&mut std::io::Cursor::new(&mut input_buf_v), ImageFormat::Png).unwrap();
        
        // 垂直反転
        let result_buf_v = flip_image(&input_buf_v, false);
        let result_img_v = ImageReader::new(std::io::Cursor::new(result_buf_v))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        // 垂直反転後のサイズは変わらないはず
        let (width_v, height_v) = result_img_v.dimensions();
        assert_eq!(width_v, width, "垂直反転後も幅は変わらないはず");
        assert_eq!(height_v, height, "垂直反転後も高さは変わらないはず");
        
        // 垂直反転後は上下が入れ替わるはず
        let result_rgba_v = result_img_v.to_rgba8();
        
        // 上側が黄色になっているか確認
        let top_pixel = result_rgba_v.get_pixel(width_v / 2, height_v / 4);
        assert_eq!(top_pixel[0], 255, "垂直反転後の上側は黄色になるはず");
        assert_eq!(top_pixel[1], 255, "垂直反転後の上側は黄色になるはず");
        assert_eq!(top_pixel[2], 0, "垂直反転後の上側は黄色になるはず");
        
        // 下側が緑色になっているか確認
        let bottom_pixel = result_rgba_v.get_pixel(width_v / 2, 3 * height_v / 4);
        assert_eq!(bottom_pixel[0], 0, "垂直反転後の下側は緑色になるはず");
        assert_eq!(bottom_pixel[1], 255, "垂直反転後の下側は緑色になるはず");
        assert_eq!(bottom_pixel[2], 0, "垂直反転後の下側は緑色になるはず");
    }
} 