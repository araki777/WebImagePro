use wasm_bindgen::prelude::*;
use image::io::Reader as ImageReader;
use image::ImageOutputFormat;

// 画像の回転
#[wasm_bindgen]
pub fn rotate_image(input: &[u8], degrees: u32) -> Vec<u8> {
    let mut buf = Vec::new();
    let img = ImageReader::new(std::io::Cursor::new(input))
        .with_guessed_format()
        .unwrap()
        .decode()
        .unwrap();

    // 回転処理
    let rotated_image = match degrees {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => img,
    };

    // PNGとして出力
    rotated_image.write_to(&mut std::io::Cursor::new(&mut buf), ImageOutputFormat::Png).unwrap();

    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::{ImageBuffer, Rgba, RgbaImage, ImageFormat, GenericImageView};

    #[test]
    fn test_rotate_image() {
        // テスト用の画像データを作成（長方形の画像: 100x50）
        let original_width = 100;
        let original_height = 50;
        let mut img: RgbaImage = ImageBuffer::new(original_width, original_height);
        
        // 左側を赤、右側を青にして区別できるようにする
        for x in 0..original_width {
            for y in 0..original_height {
                if x < original_width / 2 {
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
        
        // テスト1: 90度回転
        let degrees_90 = 90;
        let result_buf_90 = rotate_image(&input_buf, degrees_90);
        let result_img_90 = ImageReader::new(std::io::Cursor::new(result_buf_90))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        // 90度回転後のサイズを確認（幅と高さが入れ替わる）
        let (width_90, height_90) = result_img_90.dimensions();
        assert_eq!(width_90, original_height, "90度回転後は幅と高さが入れ替わるはず");
        assert_eq!(height_90, original_width, "90度回転後は幅と高さが入れ替わるはず");
        
        // 90度回転後は上側が赤、下側が青になるはず
        let result_rgba_90 = result_img_90.to_rgba8();
        // 上側（元の左側）をチェック
        let top_pixel = result_rgba_90.get_pixel(width_90 / 2, height_90 / 4);
        assert_eq!(top_pixel[0], 255, "上側は赤色になっているはず");
        assert_eq!(top_pixel[1], 0, "上側は赤色になっているはず");
        assert_eq!(top_pixel[2], 0, "上側は赤色になっているはず");
        
        // 下側（元の右側）をチェック
        let bottom_pixel = result_rgba_90.get_pixel(width_90 / 2, 3 * height_90 / 4);
        assert_eq!(bottom_pixel[0], 0, "下側は青色になっているはず");
        assert_eq!(bottom_pixel[1], 0, "下側は青色になっているはず");
        assert_eq!(bottom_pixel[2], 255, "下側は青色になっているはず");
        
        // テスト2: 180度回転
        let degrees_180 = 180;
        let result_buf_180 = rotate_image(&input_buf, degrees_180);
        let result_img_180 = ImageReader::new(std::io::Cursor::new(result_buf_180))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        // 180度回転後のサイズを確認（サイズは変わらない）
        let (width_180, height_180) = result_img_180.dimensions();
        assert_eq!(width_180, original_width, "180度回転後もサイズは変わらないはず");
        assert_eq!(height_180, original_height, "180度回転後もサイズは変わらないはず");
        
        // 180度回転後は右側が赤、左側が青になるはず（元の左右が反転）
        let result_rgba_180 = result_img_180.to_rgba8();
        // 右側（元の左側）をチェック
        let right_pixel = result_rgba_180.get_pixel(3 * width_180 / 4, height_180 / 2);
        assert_eq!(right_pixel[0], 255, "右側は赤色になっているはず");
        assert_eq!(right_pixel[1], 0, "右側は赤色になっているはず");
        assert_eq!(right_pixel[2], 0, "右側は赤色になっているはず");
        
        // 左側（元の右側）をチェック
        let left_pixel = result_rgba_180.get_pixel(width_180 / 4, height_180 / 2);
        assert_eq!(left_pixel[0], 0, "左側は青色になっているはず");
        assert_eq!(left_pixel[1], 0, "左側は青色になっているはず");
        assert_eq!(left_pixel[2], 255, "左側は青色になっているはず");
        
        // テスト3: 無効な角度
        let degrees_invalid = 45; // 90, 180, 270以外
        let result_buf_invalid = rotate_image(&input_buf, degrees_invalid);
        let result_img_invalid = ImageReader::new(std::io::Cursor::new(result_buf_invalid))
            .with_guessed_format()
            .unwrap()
            .decode()
            .unwrap();
        
        // 無効な角度の場合は元の画像と同じになるはず
        let (width_invalid, height_invalid) = result_img_invalid.dimensions();
        assert_eq!(width_invalid, original_width, "無効な角度では元のサイズのまま");
        assert_eq!(height_invalid, original_height, "無効な角度では元のサイズのまま");
        
        // 元の画像と同じパターンか確認
        let result_rgba_invalid = result_img_invalid.to_rgba8();
        // 左側が赤か確認
        let left_pixel_invalid = result_rgba_invalid.get_pixel(width_invalid / 4, height_invalid / 2);
        assert_eq!(left_pixel_invalid[0], 255, "左側は赤色のままのはず");
        assert_eq!(left_pixel_invalid[1], 0, "左側は赤色のままのはず");
        assert_eq!(left_pixel_invalid[2], 0, "左側は赤色のままのはず");
        
        // 右側が青か確認
        let right_pixel_invalid = result_rgba_invalid.get_pixel(3 * width_invalid / 4, height_invalid / 2);
        assert_eq!(right_pixel_invalid[0], 0, "右側は青色のままのはず");
        assert_eq!(right_pixel_invalid[1], 0, "右側は青色のままのはず");
        assert_eq!(right_pixel_invalid[2], 255, "右側は青色のままのはず");
    }
} 