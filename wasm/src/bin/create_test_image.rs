use image::{ImageBuffer, RgbImage, Rgb};
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 保存先のディレクトリとファイル名
    let output_dir = Path::new("test_images");
    if !output_dir.exists() {
        std::fs::create_dir_all(output_dir)?;
    }

    // 800x600のカラー画像を作成
    let width = 800;
    let height = 600;
    let mut img = RgbImage::new(width, height);

    // 背景色（空色）で塗りつぶす
    for y in 0..height {
        for x in 0..width {
            img.put_pixel(x, y, Rgb([135, 206, 235]));
        }
    }

    // 下部に地面（緑色）を描画
    for y in 450..height {
        for x in 0..width {
            img.put_pixel(x, y, Rgb([34, 139, 34]));
        }
    }

    // 家を描画
    draw_house(&mut img, 300, 300);

    // 人を描画
    draw_person(&mut img, 200, 400);

    // 車を描画
    draw_car(&mut img, 500, 450);

    // 木を描画
    draw_tree(&mut img, 100, 400);
    draw_tree(&mut img, 650, 400);

    // 画像を保存
    let output_path = output_dir.join("sample1.jpg");
    img.save(&output_path)?;
    println!("テスト画像を保存しました: {:?}", output_path);

    // 2つ目の画像（別の構図）を作成
    let mut img2 = RgbImage::new(width, height);

    // 背景色（夕焼け色）で塗りつぶす
    for y in 0..height {
        for x in 0..width {
            let sky_color = if y < 300 {
                Rgb([255, 165, 0]) // オレンジ（上部）
            } else {
                // 下部に行くにつれて徐々に暗くなる
                let factor = (height - y) as f32 / (height - 300) as f32;
                Rgb([
                    (255.0 * factor) as u8,
                    (165.0 * factor) as u8,
                    0
                ])
            };
            img2.put_pixel(x, y, sky_color);
        }
    }

    // 下部に道路を描画
    for y in 450..height {
        for x in 0..width {
            img2.put_pixel(x, y, Rgb([60, 60, 60]));
        }
    }

    // 中央に白線を描画
    for y in 500..520 {
        for x in 100..200 {
            img2.put_pixel(x, y, Rgb([255, 255, 255]));
        }

        for x in 300..400 {
            img2.put_pixel(x, y, Rgb([255, 255, 255]));
        }

        for x in 500..600 {
            img2.put_pixel(x, y, Rgb([255, 255, 255]));
        }

        for x in 700..800 {
            img2.put_pixel(x, y, Rgb([255, 255, 255]));
        }
    }

    // ビルを描画
    draw_building(&mut img2, 200, 200, 100, 250);
    draw_building(&mut img2, 350, 150, 120, 300);
    draw_building(&mut img2, 500, 250, 80, 200);

    // 車を描画
    draw_car(&mut img2, 150, 490);
    draw_car(&mut img2, 450, 480);
    draw_car(&mut img2, 700, 500);

    // 2つ目の画像を保存
    let output_path2 = output_dir.join("sample2.jpg");
    img2.save(&output_path2)?;
    println!("テスト画像を保存しました: {:?}", output_path2);

    Ok(())
}

fn draw_house(img: &mut RgbImage, x: u32, y: u32) {
    // 家の本体（茶色の四角）
    for dy in 0..100 {
        for dx in 0..100 {
            if x + dx < img.width() && y + dy < img.height() {
                img.put_pixel(x + dx, y + dy, Rgb([139, 69, 19]));
            }
        }
    }

    // 屋根（赤色の三角形）
    for dy in 0..50 {
        for dx in 0..(100 + dy * 2) {
            let actual_x = x as i32 - dy as i32 + dx as i32;
            if actual_x >= 0 && actual_x < img.width() as i32 && (y as i32 - 50 + dy as i32) >= 0 && (y - 50 + dy) < img.height() {
                img.put_pixel(actual_x as u32, y - 50 + dy, Rgb([205, 92, 92]));
            }
        }
    }

    // 窓（水色の四角）
    for dy in 0..20 {
        for dx in 0..20 {
            if x + 20 + dx < img.width() && y + 30 + dy < img.height() {
                img.put_pixel(x + 20 + dx, y + 30 + dy, Rgb([135, 206, 250]));
            }
        }
    }

    // ドア（濃い茶色の四角）
    for dy in 0..40 {
        for dx in 0..30 {
            if x + 60 + dx < img.width() && y + 60 + dy < img.height() {
                img.put_pixel(x + 60 + dx, y + 60 + dy, Rgb([101, 67, 33]));
            }
        }
    }
}

fn draw_person(img: &mut RgbImage, x: u32, y: u32) {
    // 頭（肌色の円）
    for dy in 0..20 {
        for dx in 0..20 {
            let center_x = 10;
            let center_y = 10;
            let distance = ((dx as i32 - center_x).pow(2) + (dy as i32 - center_y).pow(2)) as f32;
            if distance.sqrt() <= 10.0 && x + dx < img.width() && y + dy < img.height() {
                img.put_pixel(x + dx, y + dy, Rgb([255, 218, 185]));
            }
        }
    }

    // 体（青色の四角）
    for dy in 0..40 {
        for dx in 0..30 {
            if x - 5 + dx < img.width() && y + 20 + dy < img.height() {
                img.put_pixel(x - 5 + dx, y + 20 + dy, Rgb([0, 0, 139]));
            }
        }
    }

    // 足（灰色の2本線）
    for dy in 0..30 {
        for dx in 0..8 {
            if x + dx < img.width() && y + 60 + dy < img.height() {
                img.put_pixel(x + dx, y + 60 + dy, Rgb([105, 105, 105]));
            }
        }

        for dx in 0..8 {
            if x + 12 + dx < img.width() && y + 60 + dy < img.height() {
                img.put_pixel(x + 12 + dx, y + 60 + dy, Rgb([105, 105, 105]));
            }
        }
    }

    // 腕（肌色の2本線）
    for dy in 0..8 {
        for dx in 0..25 {
            if x - 20 + dx < img.width() && y + 25 + dy < img.height() {
                img.put_pixel(x - 20 + dx, y + 25 + dy, Rgb([255, 218, 185]));
            }
        }

        for dx in 0..25 {
            if x + 20 + dx < img.width() && y + 25 + dy < img.height() {
                img.put_pixel(x + 20 + dx, y + 25 + dy, Rgb([255, 218, 185]));
            }
        }
    }
}

fn draw_car(img: &mut RgbImage, x: u32, y: u32) {
    // 車体（赤色の四角）
    for dy in 0..30 {
        for dx in 0..80 {
            if x + dx < img.width() && y + dy < img.height() {
                img.put_pixel(x + dx, y + dy, Rgb([255, 0, 0]));
            }
        }
    }

    // ウィンドウ（水色の四角）
    for dy in 0..15 {
        for dx in 0..30 {
            if x + 25 + dx < img.width() && y + 5 + dy < img.height() {
                img.put_pixel(x + 25 + dx, y + 5 + dy, Rgb([173, 216, 230]));
            }
        }
    }

    // タイヤ（黒色の2つの円）
    for dy in 0..20 {
        for dx in 0..20 {
            let center_x = 10;
            let center_y = 10;
            let distance = ((dx as i32 - center_x).pow(2) + (dy as i32 - center_y).pow(2)) as f32;
            if distance.sqrt() <= 10.0 {
                if x + 10 + dx < img.width() && y + 20 + dy < img.height() {
                    img.put_pixel(x + 10 + dx, y + 20 + dy, Rgb([0, 0, 0]));
                }

                if x + 50 + dx < img.width() && y + 20 + dy < img.height() {
                    img.put_pixel(x + 50 + dx, y + 20 + dy, Rgb([0, 0, 0]));
                }
            }
        }
    }
}

fn draw_tree(img: &mut RgbImage, x: u32, y: u32) {
    // 幹（茶色の四角）
    for dy in 0..80 {
        for dx in 0..20 {
            if x + dx < img.width() && y + dy < img.height() {
                img.put_pixel(x + dx, y + dy, Rgb([139, 69, 19]));
            }
        }
    }

    // 葉（緑色の円）
    for dy in 0..80 {
        for dx in 0..80 {
            let center_x = 40;
            let center_y = 40;
            let distance = ((dx as i32 - center_x).pow(2) + (dy as i32 - center_y).pow(2)) as f32;
            if distance.sqrt() <= 40.0 && x - 30 + dx < img.width() && y - 50 + dy < img.height() {
                img.put_pixel(x - 30 + dx, y - 50 + dy, Rgb([34, 139, 34]));
            }
        }
    }
}

fn draw_building(img: &mut RgbImage, x: u32, y: u32, width: u32, height: u32) {
    // ビルの本体
    for dy in 0..height {
        for dx in 0..width {
            if x + dx < img.width() && y + dy < img.height() {
                img.put_pixel(x + dx, y + dy, Rgb([169, 169, 169]));
            }
        }
    }

    // 窓を描画
    let window_width = 10;
    let window_height = 15;
    let spacing = 15;

    for row in 0..(height / (window_height + spacing)) {
        for col in 0..(width / (window_width + spacing)) {
            let window_x = x + col * (window_width + spacing) + spacing;
            let window_y = y + row * (window_height + spacing) + spacing;

            // 窓が点灯しているかランダムに決定（夕方の設定）
            let is_light_on = (window_x * window_y) % 3 == 0;
            let window_color = if is_light_on {
                Rgb([255, 255, 224]) // 明るい黄色（点灯）
            } else {
                Rgb([47, 79, 79]) // 暗い緑色（消灯）
            };

            for wy in 0..window_height {
                for wx in 0..window_width {
                    if window_x + wx < img.width() && window_y + wy < img.height() {
                        img.put_pixel(window_x + wx, window_y + wy, window_color);
                    }
                }
            }
        }
    }
}