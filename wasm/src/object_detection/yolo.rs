use image::RgbImage;
use tract_onnx::prelude::*;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use std::io::Cursor;
use tract_ndarray::{ArrayView, Dim, IxDynImpl};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
    pub class_id: u32,
    pub class_name: String,
    pub confidence: f32,
    pub x1: u32,
    pub y1: u32,
    pub x2: u32,
    pub y2: u32,
}

// Cloneトレイトを手動で実装
#[derive(Debug)]
pub struct YoloModel {
    pub width: u32,
    pub height: u32,
    pub model: RunnableModel<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>,
    pub classes: Vec<String>,  // クラス名のリストを追加
}

// YoloModelのClone実装
// モデルはポインタで共有されるため、実際にはディープコピーではなく参照カウントが増えるだけ
impl Clone for YoloModel {
    fn clone(&self) -> Self {
        YoloModel {
            width: self.width,
            height: self.height,
            model: self.model.clone(),
            classes: self.classes.clone(),
        }
    }
}

impl YoloModel {
    // モデルバイナリから新しいYOLOモデルを初期化（サイズは32の倍数に調整）
    pub fn new(model_bytes: &[u8]) -> Result<YoloModel, Box<dyn std::error::Error>> {
        // デフォルトサイズとして640x640を使用
        Self::new_with_size(model_bytes, 640, 640)
    }

    // 指定されたサイズでYOLOモデルを初期化（サイズは32の倍数に調整）
    pub fn new_with_size(model_bytes: &[u8], width: u32, height: u32) -> Result<YoloModel, Box<dyn std::error::Error>> {
        // 32の倍数に調整（切り上げ）
        let width = ((width + 31) / 32) * 32;
        let height = ((height + 31) / 32) * 32;

        log(&format!("メモリからモデルをロード中: {} バイト", model_bytes.len()));
        log(&format!("調整された入力サイズ: {}x{}", width, height));

        // パフォーマンス向上のためにtract関連の設定をするが、利用可能なAPIのみを使用
        let onnx = tract_onnx::onnx();

        // バイナリデータから直接モデルを読み込む
        let model = match onnx.model_for_read(&mut Cursor::new(model_bytes)) {
            Ok(m) => m,
            Err(e) => {
                log(&format!("モデル読み込みエラー: {:?}", e));
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other,
                    format!("モデルの読み込みに失敗: {:?}", e))));
            }
        };

        log(&format!("モデル入力形状: {:?}", model.input_fact(0)?.shape));

        // 入力サイズを固定サイズに設定
        let model = match model.with_input_fact(0, InferenceFact::dt_shape(f32::datum_type(),
            tvec!(1, 3, height as i32, width as i32))) {
            Ok(m) => m,
            Err(e) => {
                log(&format!("入力サイズ設定エラー: {:?}", e));
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other,
                    format!("入力サイズの設定に失敗: {:?}", e))));
            }
        };

        // ログ出力
        log(&format!("入力設定後のモデル: 入力={}, 出力={}",
                    model.inputs.len(), model.outputs.len()));

        // より慎重な方法でモデルを変換
        let typed_model = match model.into_typed() {
            Ok(m) => m,
            Err(e) => {
                log(&format!("モデル型変換エラー: {:?}", e));
                // 型変換に失敗した場合はより詳細な情報を提供
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other,
                    format!("モデルの型変換に失敗: {:?}", e))));
            }
        };

        // 実行可能モデルに変換
        let model = match typed_model.into_runnable() {
            Ok(m) => m,
            Err(e) => {
                log(&format!("実行可能モデル変換エラー: {:?}", e));
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other,
                    format!("実行可能モデルへの変換に失敗: {:?}", e))));
            }
        };

        log("メモリからのモデルロードに成功しました");

        // COCOデータセットの標準クラスを初期化
        let classes = vec![
            "person".to_string(), "bicycle".to_string(), "car".to_string(), "motorcycle".to_string(),
            "airplane".to_string(), "bus".to_string(), "train".to_string(), "truck".to_string(),
            "boat".to_string(), "traffic light".to_string(), "fire hydrant".to_string(),
            "stop sign".to_string(), "parking meter".to_string(), "bench".to_string(), "bird".to_string(),
            "cat".to_string(), "dog".to_string(), "horse".to_string(), "sheep".to_string(),
            "cow".to_string(), "elephant".to_string(), "bear".to_string(), "zebra".to_string(),
            "giraffe".to_string(), "backpack".to_string(), "umbrella".to_string(), "handbag".to_string(),
            "tie".to_string(), "suitcase".to_string(), "frisbee".to_string(), "skis".to_string(),
            "snowboard".to_string(), "sports ball".to_string(), "kite".to_string(), "baseball bat".to_string(),
            "baseball glove".to_string(), "skateboard".to_string(), "surfboard".to_string(),
            "tennis racket".to_string(), "bottle".to_string(), "wine glass".to_string(), "cup".to_string(),
            "fork".to_string(), "knife".to_string(), "spoon".to_string(), "bowl".to_string(), "banana".to_string(),
            "apple".to_string(), "sandwich".to_string(), "orange".to_string(), "broccoli".to_string(),
            "carrot".to_string(), "hot dog".to_string(), "pizza".to_string(), "donut".to_string(),
            "cake".to_string(), "chair".to_string(), "couch".to_string(), "potted plant".to_string(),
            "bed".to_string(), "dining table".to_string(), "toilet".to_string(), "tv".to_string(),
            "laptop".to_string(), "mouse".to_string(), "remote".to_string(), "keyboard".to_string(),
            "cell phone".to_string(), "microwave".to_string(), "oven".to_string(), "toaster".to_string(),
            "sink".to_string(), "refrigerator".to_string(), "book".to_string(), "clock".to_string(),
            "vase".to_string(), "scissors".to_string(), "teddy bear".to_string(), "hair drier".to_string(),
            "toothbrush".to_string()
        ];

        Ok(YoloModel { width, height, model, classes })
    }

    // アスペクト比を維持した最適なサイズを計算
    pub fn optimal_dimensions(image_width: u32, image_height: u32, max_dim: u32) -> (u32, u32) {
        let ratio = image_width as f32 / image_height as f32;

        let (mut new_width, mut new_height) = if ratio > 1.0 {
            // 横長画像
            let w = max_dim.min(image_width);
            let h = (w as f32 / ratio).round() as u32;
            (w, h)
        } else {
            // 縦長画像
            let h = max_dim.min(image_height);
            let w = (h as f32 * ratio).round() as u32;
            (w, h)
        };

        // 32の倍数に調整（切り上げ）
        new_width = ((new_width + 31) / 32) * 32;
        new_height = ((new_height + 31) / 32) * 32;

        (new_width, new_height)
    }

    // 画像の大きさに適したモデルサイズを選択して新規モデルを作成
    pub fn new_for_image(model_bytes: &[u8], image: &RgbImage, max_dim: u32) -> Result<YoloModel, Box<dyn std::error::Error>> {
        let (width, height) = Self::optimal_dimensions(image.width(), image.height(), max_dim);
        Self::new_with_size(model_bytes, width, height)
    }

    // 画像をリサイズして物体検出を実行（CenterFaceと類似のインターフェース）
    pub fn detect_with_resize(&self, image: &RgbImage) -> Vec<Detection> {
        let org_width = image.width();
        let org_height = image.height();

        // 元の画像寸法を記録
        log(&format!("元の画像サイズ: {}x{}", org_width, org_height));

        // 検出器の入力サイズに画像をリサイズ（アスペクト比維持）
        let resized = image::imageops::resize(
            image, self.width, self.height, image::imageops::FilterType::Triangle,
        );

        // リサイズされた画像で検出を実行
        let mut detections = self.detect_image(&resized);

        log(&format!("検出結果数: {}", detections.len()));

        // 検出結果を元の画像サイズにスケールバック
        for detection in &mut detections {
            // 元のサイズに戻す
            detection.x1 = (detection.x1 as f32 * org_width as f32 / self.width as f32) as u32;
            detection.y1 = (detection.y1 as f32 * org_height as f32 / self.height as f32) as u32;
            detection.x2 = (detection.x2 as f32 * org_width as f32 / self.width as f32) as u32;
            detection.y2 = (detection.y2 as f32 * org_height as f32 / self.height as f32) as u32;
        }

        detections
    }

    // RGBImageを検出用に処理
    pub fn detect_image(&self, image: &RgbImage) -> Vec<Detection> {
        // 画像をテンソルに変換
        let tensor = self.preprocess_image(image);

        // 検出実行
        match self.detect(tensor) {
            Ok(detections) => detections,
            Err(e) => {
                log(&format!("検出エラー: {:?}", e));
                Vec::new()
            }
        }
    }

    // 画像をテンソルに変換
    fn preprocess_image(&self, image: &RgbImage) -> Tensor {
        // 画像がすでにモデルサイズであることを前提とする
        // NCHW形式(バッチ、チャンネル、高さ、幅)にデータを整形
        let tensor: Tensor = tract_ndarray::Array4::from_shape_fn(
            (1, 3, self.height as usize, self.width as usize),
            |(_, c, y, x)| {
                // RGBチャンネルの値を0〜1の範囲に正規化
                let pixel = image.get_pixel(x as u32, y as u32);
                pixel[c] as f32 / 255.0
            }
        ).into();

        tensor
    }

    // テンソルから直接物体検出を実行
    pub fn detect(&self, image: Tensor) -> TractResult<Vec<Detection>> {
        // モデルを実行
        let result = self.model.run(tvec!(image.into()))?;

        // 出力テンソルを解析
        let output = result[0].to_array_view::<f32>()?;

        // 出力から検出結果を抽出
        let mut detections = self.process_output(&output, (self.height, self.width));

        // NMSによる重複除去
        Ok(self.non_max_suppression(&mut detections))
    }

    // 検出結果を処理する
    pub fn process_output(&self, model_output: &ArrayView<f32, Dim<IxDynImpl>>, img_shape: (u32, u32)) -> Vec<Detection> {
        let (img_height, img_width) = img_shape;
        let batch_size = model_output.shape()[0];
        let rows = model_output.shape()[1];

        // 統一された信頼度閾値を設定
        let confidence_threshold = 0.25;

        log(&format!("処理中: {}個の候補オブジェクトを評価します", rows));

        let mut detections = Vec::new();

        // 各検出結果を処理
        for b in 0..batch_size {
            for r in 0..rows {
                let bbox_conf = model_output[[b, r, 4]];
                // 閾値より低い信頼度の検出はスキップ
                if bbox_conf < 0.1 { continue; }

                // 各クラスごとにスコアを計算して最大のものを選択
                let mut max_class_conf = 0.0;
                let mut class_id = 0;

                for c in 0..self.classes.len() {
                    let class_conf = model_output[[b, r, 5 + c]];
                    let conf = bbox_conf * class_conf;

                    if conf > max_class_conf {
                        max_class_conf = conf;
                        class_id = c;
                    }
                }

                // 最終的な信頼度が閾値より低い場合はスキップ
                if max_class_conf < confidence_threshold {
                    continue;
                }

                // バウンディングボックスの座標を取得
                let x_center = model_output[[b, r, 0]];
                let y_center = model_output[[b, r, 1]];
                let width = model_output[[b, r, 2]];
                let height = model_output[[b, r, 3]];

                // 画像内の実際の座標に変換
                let left = (x_center - width / 2.0) * img_width as f32;
                let top = (y_center - height / 2.0) * img_height as f32;
                let right = (x_center + width / 2.0) * img_width as f32;
                let bottom = (y_center + height / 2.0) * img_height as f32;

                // 座標が画像内に収まるように調整
                let left = left.max(0.0).min(img_width as f32);
                let top = top.max(0.0).min(img_height as f32);
                let right = right.max(0.0).min(img_width as f32);
                let bottom = bottom.max(0.0).min(img_height as f32);

                // バウンディングボックスが有効かチェック
                if right > left && bottom > top {
                    let detection = Detection {
                        class_id: class_id as u32,
                        class_name: self.classes[class_id].clone(),
                        confidence: max_class_conf,
                        x1: left as u32,
                        y1: top as u32,
                        x2: right as u32,
                        y2: bottom as u32,
                    };

                    detections.push(detection);
                }
            }
        }

        log(&format!("NMS前に{}個の候補オブジェクトを検出しました", detections.len()));

        // 非最大抑制を適用して重複検出を除去
        self.non_max_suppression(&mut detections)
    }

    // 検出結果の重複を除去するNMS（Non-Maximum Suppression）を実行
    fn non_max_suppression(&self, detections: &mut Vec<Detection>) -> Vec<Detection> {
        // 信頼度スコアでソート（降順）
        detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

        let mut indices = vec![true; detections.len()];

        // 統一されたIoU閾値
        let iou_threshold = 0.45;

        for i in 0..detections.len() {
            if !indices[i] {
                continue;
            }

            for j in i+1..detections.len() {
                if !indices[j] || detections[i].class_id != detections[j].class_id {
                    continue;
                }

                let iou = self.calculate_iou(&detections[i], &detections[j]);

                if iou > iou_threshold {
                    indices[j] = false;
                }
            }
        }

        let mut result = Vec::new();
        for i in 0..detections.len() {
            if indices[i] {
                result.push(detections[i].clone());
            }
        }

        log(&format!("NMS後に{}個のオブジェクトを検出しました", result.len()));

        result
    }

    // IoU（Intersection over Union）計算
    fn calculate_iou(&self, a: &Detection, b: &Detection) -> f32 {
        let x1 = a.x1.max(b.x1) as f32;
        let y1 = a.y1.max(b.y1) as f32;
        let x2 = a.x2.min(b.x2) as f32;
        let y2 = a.y2.min(b.y2) as f32;

        if x2 < x1 || y2 < y1 {
            return 0.0;
        }

        let intersection = (x2 - x1) * (y2 - y1);
        let a_area = (a.x2 - a.x1) as f32 * (a.y2 - a.y1) as f32;
        let b_area = (b.x2 - b.x1) as f32 * (b.y2 - b.y1) as f32;

        intersection / (a_area + b_area - intersection)
    }
}