// CenterFace: 軽量で高速な顔検出アルゴリズムの実装
// このモジュールは、ONNXモデルを使用して画像内の顔を検出し、
// 顔のバウンディングボックスと5つのランドマーク（目、鼻、口の角）を提供します。
use std::cmp::{max, min};
use std::io::BufReader;

use serde::{Deserialize, Serialize};
use tract_onnx::prelude::*;
use tract_onnx::prelude::tract_itertools::Itertools;
use tract_onnx::prelude::tract_ndarray::ArrayViewD;

#[cfg(feature = "image")]
use {
    image::{imageops, RgbImage},
    tract_onnx::prelude::tract_ndarray::Array4,
};

// CenterFace検出器の主要構造体
// widthとheight: 入力画像のサイズ（モデルの入力サイズに一致する必要がある）
// model: Tractで最適化されたONNXモデル
pub struct CenterFace {
    width: u32,
    height: u32,
    model: RunnableModel<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>,
}

// 検出された顔の情報を格納する構造体
// (x1,y1)と(x2,y2): 顔のバウンディングボックスの左上と右下の座標
// score: 検出の信頼度スコア
// landmarks: 顔の5つの特徴点（目、鼻、口の角）の座標
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Face {
    pub x1: u32,
    pub y1: u32,
    pub x2: u32,
    pub y2: u32,
    pub score: f32,
    pub landmarks: Vec<(u32, u32)>,
}

impl CenterFace {
    // 指定された幅と高さで新しいCenterFace検出器を初期化
    // ONNXモデルをバイナリから読み込み、入出力の形状を指定して最適化
    pub fn new(width: u32, height: u32) -> TractResult<CenterFace> {
        // 入力サイズに基づいてスケーリングファクターを計算
        // モデルの出力は8倍ダウンサンプリングされる
        let ws = (width / 32) as i32;
        let hs = (height / 32) as i32;
        // 埋め込まれたONNXモデルを読み込む
        let onnx_model = include_bytes!("../../ai_models/centerface.onnx");
        let model = onnx().model_for_read(&mut BufReader::new(&onnx_model[..]))?
            .with_input_fact(0, InferenceFact::dt_shape(f32::datum_type(), tvec![1, 3, height as i32, width as i32]))?
            .with_output_fact(0, InferenceFact::dt_shape(f32::datum_type(), tvec![1, 1, 8 * hs, 8 * ws]))?
            .with_output_fact(1, InferenceFact::dt_shape(f32::datum_type(), tvec![1, 2, 8 * hs, 8 * ws]))?
            .with_output_fact(2, InferenceFact::dt_shape(f32::datum_type(), tvec![1, 2, 8 * hs, 8 * ws]))?
            .with_output_fact(3, InferenceFact::dt_shape(f32::datum_type(), tvec![1, 10, 8 * hs, 8 * ws]))?
            .into_optimized()?
            .into_runnable()?;

        Ok(CenterFace { width, height, model })
    }

    // image機能が有効な場合、画像をリサイズして顔検出を実行
    // 元の画像サイズと検出器のサイズが異なる場合、結果を元のサイズに戻す
    #[cfg(feature = "image")]
    pub fn detect_with_resize(&self, image: &RgbImage) -> TractResult<Vec<Face>> {
        let org_width = image.width();
        let org_height = image.height();

        // 検出器の入力サイズに画像をリサイズ
        let image = imageops::resize(
            image, self.width, self.height, imageops::FilterType::Triangle,
        );

        // リサイズされた画像で顔検出を実行
        let mut faces = self.detect_image(&image)?;

        // 検出結果を元の画像サイズにスケールバック
        for i in 0..faces.len() {
            faces[i].x1 = faces[i].x1 * org_width / self.width;
            faces[i].x2 = faces[i].x2 * org_width / self.width;
            faces[i].y1 = faces[i].y1 * org_height / self.height;
            faces[i].y2 = faces[i].y2 * org_height / self.height;

            // ランドマークもスケールバック
            for j in 0..5 {
                faces[i].landmarks[j].0 = faces[i].landmarks[j].0 * org_width / self.width;
                faces[i].landmarks[j].1 = faces[i].landmarks[j].1 * org_height / self.height;
            }
        }

        Ok(faces)
    }

    // image機能が有効な場合、RgbImageから顔検出を実行
    // 画像をテンソルに変換してモデルに入力
    #[cfg(feature = "image")]
    pub fn detect_image(&self, image: &RgbImage) -> TractResult<Vec<Face>> {
        // RGBイメージをモデル入力用のテンソル形式に変換
        // 形状: (1, 3, height, width) - バッチサイズ1、3チャンネル(RGB)
        let image: Tensor = Array4::from_shape_fn(
            (1, 3, self.height as usize, self.width as usize),
            |(_, c, y, x)| {
                image[(x as _, y as _)][c] as f32
            },
        ).into();

        let faces = self.detect(image)?;

        Ok(faces)
    }

    // テンソルから直接顔検出を実行するコア関数
    pub fn detect(&self, image: Tensor) -> TractResult<Vec<Face>> {
        // image: (1, 3, height, width)

        // モデルを実行して4つの出力テンソルを取得
        let result = self.model.run(tvec!(image.into()))?;

        // 出力テンソルの解析:
        // heatmap: 顔の中心点の確率マップ
        // scale: バウンディングボックスのスケール情報
        // offset: 位置のオフセット情報
        // landmark: 顔のランドマーク位置情報
        let heatmap = result.get(0).unwrap().to_array_view::<f32>()?;
        let scale = result.get(1).unwrap().to_array_view::<f32>()?;
        let offset = result.get(2).unwrap().to_array_view::<f32>()?;
        let landmark = result.get(3).unwrap().to_array_view::<f32>()?;

        // 出力テンソルから顔情報をデコード
        let faces = self.decode(heatmap, scale, offset, landmark)?;

        Ok(faces)
    }

    // モデル出力から顔の位置、サイズ、ランドマークを計算
    fn decode(
        &self,
        heatmap: ArrayViewD<f32>,
        scale: ArrayViewD<f32>,
        offset: ArrayViewD<f32>,
        landmark: ArrayViewD<f32>,
    ) -> TractResult<Vec<Face>> {
        // 検出閾値 - この値以上のスコアを持つ検出のみを考慮
        let threshold = 0.5;

        let ny = heatmap.shape()[2];
        let nx = heatmap.shape()[3];

        let mut faces = Vec::new();

        // ヒートマップの各ピクセルを走査
        for i in 0..ny {
            for j in 0..nx {
                let score = heatmap[[0, 0, i, j]];
                if score <= threshold {
                    continue;
                }

                // スケールとオフセットの計算
                // s0, s1: バウンディングボックスの高さと幅
                // o0, o1: 位置のオフセット
                let s0 = scale[[0, 0, i, j]].exp() * 4.0;
                let s1 = scale[[0, 1, i, j]].exp() * 4.0;
                let o0 = offset[[0, 0, i, j]] + 0.5;
                let o1 = offset[[0, 1, i, j]] + 0.5;

                // バウンディングボックスの座標計算
                // 元のヒートマップは入力画像の1/4サイズなので、4倍する
                let x1 = max(0, ((j as f32 + o1) * 4.0 - s1 / 2.0) as u32);
                let y1 = max(0, ((i as f32 + o0) * 4.0 - s0 / 2.0) as u32);

                // 画像境界内に収まるよう制限
                let x1 = min(x1, self.width);
                let y1 = min(y1, self.height);

                let x2 = min(x1 + s1 as u32, self.width);
                let y2 = min(y1 + s1 as u32, self.height);

                // 顔のランドマーク（5点）の座標を計算
                let mut landmarks = Vec::new();
                for k in 0..5 {
                    landmarks.push((
                        x1 + (landmark[[0, 2 * k + 1, i, j]] * s1) as u32,
                        y1 + (landmark[[0, 2 * k, i, j]] * s0) as u32
                    ));
                }

                faces.push(Face { x1, x2, y1, y2, score, landmarks });
            }
        }

        // 重複した検出を非最大抑制（NMS）で除去
        Ok(Self::nms(faces))
    }

    // 非最大抑制（NMS）: 重複した顔検出を統合する
    // スコアの高い検出を優先し、重複率が閾値より高い他の検出を除外する
    fn nms(faces: Vec<Face>) -> Vec<Face> {
        // IoU（Intersection over Union）の閾値
        let threshold = 0.3;

        // スコアの高い順にソート
        let faces: Vec<Face> = faces.into_iter()
            .sorted_by(|a, b| b.score.partial_cmp(&a.score).unwrap())
            .collect();
        let n = faces.len();
        let mut merged = vec![false; n]; // マージされた検出を追跡

        let mut output = Vec::new();

        for i in 0..n {
            if merged[i] { continue; } // すでに他の検出にマージされていたらスキップ

            output.push(faces[i].clone());

            // 現在の検出の面積を計算
            let area0 = (faces[i].x2 - faces[i].x1 + 1) * (faces[i].y2 - faces[i].y1 + 1);

            // 残りの検出と比較
            for j in i + 1..n {
                if merged[j] { continue; }

                // 二つのバウンディングボックスの重複領域を計算
                let in_x0 = if faces[i].x1 > faces[j].x1 { faces[i].x1 } else { faces[j].x1 };
                let in_y0 = if faces[i].y1 > faces[j].y1 { faces[i].y1 } else { faces[j].y1 };
                let in_x1 = if faces[i].x2 < faces[j].x2 { faces[i].x2 } else { faces[j].x2 };
                let in_y1 = if faces[i].y2 < faces[j].y2 { faces[i].y2 } else { faces[j].y2 };

                if in_x1 <= in_x0 || in_y1 <= in_y0 { continue; } // 重複がない場合はスキップ

                // 重複領域の面積と、比較対象の検出の面積を計算
                let in_area = (in_y1 - in_y0 + 1) * (in_x1 - in_x0 + 1);
                let area1 = (faces[j].y2 - faces[j].y1 + 1) * (faces[j].x2 - faces[j].x1 + 1);

                // IoU（Intersection over Union）スコアを計算
                // 二つの領域の重複率を表す
                let score = in_area as f32 / (area0 + area1 - in_area) as f32;
                if score > threshold {
                    // IoUが閾値より大きい場合、二つ目の検出をマージ済みとマーク
                    merged[j] = true;
                }
            }
        }

        output
    }
}