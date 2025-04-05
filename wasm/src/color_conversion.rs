// RGBカラー値をHSVカラー値に変換する関数
pub fn rgb_to_hsv(r: f32, g: f32, b: f32) -> (f32, f32, f32) {
    // 1~255の範囲を0~1に正規化
    let r = r / 255.0;
    let g = g / 255.0;
    let b = b / 255.0;

    // 最大値と最小値を求め、色の違い（delta）を計算
    let max = r.max(g).max(b); // 最大の色成分
    let min = r.min(g).min(b); // 最小の色成分
    let delta = max - min; // 色の違い

    // 明度（value）は最大値
    let v = max;

    // 彩度（saturation）を計算
    let s = if max != 0.0 { delta / max } else { 0.0 }; // maxが0の場合、彩度は0

    // 色相（Hue）の初期値
    let mut h = 0.0;

    // 色相（H）が定義されるのは、deltaが0出ない場合
    if delta != 0.0 {
        // 色相の計算
        if max == r {
            h = (g - b) / delta; // 赤が最大の色成分
        } else if max == g {
            h = (b - r) / delta + 2.0; // 緑が最大の色成分
        } else {
            h = (r - g) / delta + 4.0; // 青が最大の色成分
        }

        // 色相の範囲を0~360度に収める
        h *= 60.0;

        if h < 0.0 {
            h += 360.0; // 負の値の場合、360度を足して正の値にする
        }
    }

    // HSVカラー値（色相、彩度、明度）を返す
    (h, s, v)
}

// HSVカラー値をRGBカラー値に変換する関数
pub fn hsv_to_rgb(h: f32, s: f32, v: f32) -> (f32, f32, f32) {
    // 色相、彩度、明度からRGB成分を計算
    let c = v * s; // 色の強さ
    let x = c * (1.0 - ((h / 60.0) % 2.0 - 1.0).abs()); // 色の調整成分
    let m = v - c; // RGBのオフセット値

    // 色相に応じてRGB成分を計算
    let (r, g, b) = if h < 60.0 {
        (c, x, 0.0) // 0~60度（赤⇒緑）の場合
    } else if h < 120.0 {
        (x, c, 0.0) // 60~120度（緑⇒青）の場合
    } else if h < 180.0 {
        (0.0, c, x) // 120~180度（青⇒紫）の場合
    } else if h < 240.0 {
        (0.0, x, c) // 180~240度（紫⇒赤紫）の場合
    } else if h < 300.0 {
        (x, 0.0, c) // 240~300度（赤紫⇒赤）の場合
    } else {
        (c, 0.0, x) // 300~360度（赤⇒緑）の場合
    };

    // RGB成分にオフセットmを加え、0~255の範囲にスケーリング
    ((r + m) * 255.0, (g + m) * 255.0, (b + m) * 255.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    // 近似的に等しいかをチェックする関数
    fn assert_approx_eq(a: f32, b: f32, epsilon: f32) {
        assert!((a - b).abs() < epsilon, "{} is not approximately equal to {} within epsilon {}", a, b, epsilon);
    }

    // rgb_to_hsv関数のテスト
    mod rgb_to_hsv_tests {
        use super::*;

        #[test]
        fn test_pure_red() {
            let (h, s, v) = rgb_to_hsv(255.0, 0.0, 0.0);
            assert_approx_eq(h, 0.0, 0.001);
            assert_approx_eq(s, 1.0, 0.001);
            assert_approx_eq(v, 1.0, 0.001);
        }

        #[test]
        fn test_pure_green() {
            let (h, s, v) = rgb_to_hsv(0.0, 255.0, 0.0);
            assert_approx_eq(h, 120.0, 0.001);
            assert_approx_eq(s, 1.0, 0.001);
            assert_approx_eq(v, 1.0, 0.001);
        }

        #[test]
        fn test_pure_blue() {
            let (h, s, v) = rgb_to_hsv(0.0, 0.0, 255.0);
            assert_approx_eq(h, 240.0, 0.001);
            assert_approx_eq(s, 1.0, 0.001);
            assert_approx_eq(v, 1.0, 0.001);
        }

        #[test]
        fn test_black() {
            let (h, s, v) = rgb_to_hsv(0.0, 0.0, 0.0);
            assert_approx_eq(h, 0.0, 0.001);
            assert_approx_eq(s, 0.0, 0.001);
            assert_approx_eq(v, 0.0, 0.001);
        }

        #[test]
        fn test_white() {
            let (h, s, v) = rgb_to_hsv(255.0, 255.0, 255.0);
            assert_approx_eq(h, 0.0, 0.001);
            assert_approx_eq(s, 0.0, 0.001);
            assert_approx_eq(v, 1.0, 0.001);
        }

        #[test]
        fn test_yellow() {
            let (h, s, v) = rgb_to_hsv(255.0, 255.0, 0.0);
            assert_approx_eq(h, 60.0, 0.001);
            assert_approx_eq(s, 1.0, 0.001);
            assert_approx_eq(v, 1.0, 0.001);
        }
    }

    // hsv_to_rgb関数のテスト
    mod hsv_to_rgb_tests {
        use super::*;

        #[test]
        fn test_pure_red() {
            let (r, g, b) = hsv_to_rgb(0.0, 1.0, 1.0);
            assert_approx_eq(r, 255.0, 0.001);
            assert_approx_eq(g, 0.0, 0.001);
            assert_approx_eq(b, 0.0, 0.001);
        }

        #[test]
        fn test_pure_green() {
            let (r, g, b) = hsv_to_rgb(120.0, 1.0, 1.0);
            assert_approx_eq(r, 0.0, 0.001);
            assert_approx_eq(g, 255.0, 0.001);
            assert_approx_eq(b, 0.0, 0.001);
        }

        #[test]
        fn test_pure_blue() {
            let (r, g, b) = hsv_to_rgb(240.0, 1.0, 1.0);
            assert_approx_eq(r, 0.0, 0.001);
            assert_approx_eq(g, 0.0, 0.001);
            assert_approx_eq(b, 255.0, 0.001);
        }

        #[test]
        fn test_black() {
            let (r, g, b) = hsv_to_rgb(0.0, 0.0, 0.0);
            assert_approx_eq(r, 0.0, 0.001);
            assert_approx_eq(g, 0.0, 0.001);
            assert_approx_eq(b, 0.0, 0.001);
        }

        #[test]
        fn test_white() {
            let (r, g, b) = hsv_to_rgb(0.0, 0.0, 1.0);
            assert_approx_eq(r, 255.0, 0.001);
            assert_approx_eq(g, 255.0, 0.001);
            assert_approx_eq(b, 255.0, 0.001);
        }

        #[test]
        fn test_yellow() {
            let (r, g, b) = hsv_to_rgb(60.0, 1.0, 1.0);
            assert_approx_eq(r, 255.0, 0.001);
            assert_approx_eq(g, 255.0, 0.001);
            assert_approx_eq(b, 0.0, 0.001);
        }
    }

    // 相互変換のテスト（RGB→HSV→RGB）
    #[test]
    fn test_round_trip_conversion() {
        // いくつかの色のサンプル
        let test_colors = vec![
            (255.0, 0.0, 0.0),   // 赤
            (0.0, 255.0, 0.0),   // 緑
            (0.0, 0.0, 255.0),   // 青
            (255.0, 255.0, 0.0), // 黄
            (128.0, 0.0, 128.0), // 紫
            (128.0, 128.0, 128.0), // グレー
        ];

        for (r, g, b) in test_colors {
            let (h, s, v) = rgb_to_hsv(r, g, b);
            let (r2, g2, b2) = hsv_to_rgb(h, s, v);
            
            // 元のRGB値と変換後のRGB値が近似的に等しいことを確認
            assert_approx_eq(r, r2, 1.0);
            assert_approx_eq(g, g2, 1.0);
            assert_approx_eq(b, b2, 1.0);
        }
    }
}