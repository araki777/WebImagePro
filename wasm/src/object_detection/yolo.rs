use image::RgbImage;
use tract_onnx::prelude::*;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use std::io::Cursor;
use tract_ndarray::{ArrayView, Dim, IxDynImpl};
use ndarray::s;

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

#[derive(Debug)]
pub struct YoloModel {
    pub width: u32,
    pub height: u32,
    pub model: RunnableModel<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>,
    pub classes: Vec<String>,
    pub confidence_threshold: f32,
    pub iou_threshold: f32,
}

impl Clone for YoloModel {
    fn clone(&self) -> Self {
        YoloModel {
            width: self.width,
            height: self.height,
            model: self.model.clone(),
            classes: self.classes.clone(),
            confidence_threshold: self.confidence_threshold,
            iou_threshold: self.iou_threshold,
        }
    }
}

impl YoloModel {
    pub fn new(model_bytes: &[u8], width: u32, height: u32, confidence_threshold: f32, iou_threshold: f32) -> Result<YoloModel, Box<dyn std::error::Error>> {
        log(&format!("メモリからモデルをロード中: {} バイト", model_bytes.len()));
        log(&format!("入力サイズ: {}x{}", width, height));
        log(&format!("閾値設定: 信頼度={}, IoU={}", confidence_threshold, iou_threshold));

        // tract関連の設定
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

        log("メモリからのモデルロードに成功しました");

        // 入力と出力の形状を指定してモデルを最適化
        log("入力形状を指定しています...");
        let model_with_fact = match model.with_input_fact(0, InferenceFact::dt_shape(f32::datum_type(), tvec![1, 3, height as i32, width as i32])) {
            Ok(m) => m,
            Err(e) => {
                log(&format!("入力形状指定エラー: {:?}", e));
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other,
                    format!("入力形状の指定に失敗: {:?}", e))));
            }
        };

        // 最適化せずに型付きモデルに変換
        log("型付きモデルに変換しています...");
        let typed_model = match model_with_fact.into_typed() {
            Ok(tm) => tm,
            Err(e) => {
                log(&format!("モデル型変換エラー: {:?}", e));
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other,
                    format!("モデルの型変換に失敗: {:?}", e))));
            }
        };

        // 実行可能なモデルに変換
        log("実行可能なモデルに変換しています...");
        let model = match typed_model.into_runnable() {
            Ok(rm) => rm,
            Err(e) => {
                log(&format!("実行可能モデル変換エラー: {:?}", e));
                return Err(Box::new(std::io::Error::new(std::io::ErrorKind::Other,
                    format!("実行可能モデルへの変換に失敗: {:?}", e))));
            }
        };

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

        Ok(YoloModel { width, height, model, classes, confidence_threshold, iou_threshold })
    }

    // 画像をリサイズして物体検出を実行
    pub fn detect_with_resize(&self, image: &RgbImage) -> Vec<Detection> {
        let org_width = image.width();
        let org_height = image.height();

        // 元の画像寸法を記録
        log(&format!("📏 元の画像サイズ: {}x{}", org_width, org_height));

        // アスペクト比を維持した状態でリサイズする（letterbox手法）
        log("🔄 letterboxリサイズを実行...");
        let (resized, scale, pad_x, pad_y) = self.letterbox_resize(image);

        // リサイズされた画像で検出を実行
        log("🔍 リサイズ後の画像で検出実行...");
        let mut detections = self.detect_image(&resized);

        log(&format!("📋 検出結果数(リサイズ画像上): {}", detections.len()));

        // デバッグログ - 検出結果の座標をログ出力
        if !detections.is_empty() {
            let det = &detections[0];
            log(&format!("🔍 変換前の検出結果: クラス={}, 信頼度={:.3}, x1={}, y1={}, x2={}, y2={}",
                det.class_name, det.confidence, det.x1, det.y1, det.x2, det.y2));
        }

        // 検出結果を元の画像サイズにスケールバック
        log("🔄 検出結果を元の画像サイズに変換中...");
        for detection in &mut detections {
            // 変換前の座標を保存
            let old_x1 = detection.x1;
            let old_y1 = detection.y1;
            let old_x2 = detection.x2;
            let old_y2 = detection.y2;

            // letterboxのパディングを除去して元のサイズに変換
            let x1 = (detection.x1 as f32 - pad_x) / scale;
            let y1 = (detection.y1 as f32 - pad_y) / scale;
            let x2 = (detection.x2 as f32 - pad_x) / scale;
            let y2 = (detection.y2 as f32 - pad_y) / scale;

            // 座標を画像内に制限
            detection.x1 = x1.max(0.0).min(org_width as f32) as u32;
            detection.y1 = y1.max(0.0).min(org_height as f32) as u32;
            detection.x2 = x2.max(0.0).min(org_width as f32) as u32;
            detection.y2 = y2.max(0.0).min(org_height as f32) as u32;

            log(&format!("🔄 座標変換: [{}, {}, {}, {}] -> [{}, {}, {}, {}]",
                old_x1, old_y1, old_x2, old_y2,
                detection.x1, detection.y1, detection.x2, detection.y2));
        }

        // デバッグログ - 変換後の検出結果の座標をログ出力
        if !detections.is_empty() {
            let det = &detections[0];
            log(&format!("✅ 変換後の検出結果: クラス={}, 信頼度={:.3}, x1={}, y1={}, x2={}, y2={}",
                det.class_name, det.confidence, det.x1, det.y1, det.x2, det.y2));
        }

        detections
    }

    // letterbox手法で画像をリサイズ（アスペクト比を保持）
    fn letterbox_resize(&self, image: &RgbImage) -> (RgbImage, f32, f32, f32) {
        let img_width = image.width() as f32;
        let img_height = image.height() as f32;
        let model_width = self.width as f32;
        let model_height = self.height as f32;

        // スケール比を計算（小さい方に合わせる）
        let scale = (model_width / img_width).min(model_height / img_height);

        // スケーリング後のサイズ
        let scaled_width = (img_width * scale).round();
        let scaled_height = (img_height * scale).round();

        // パディング量を計算
        let pad_x = (model_width - scaled_width) / 2.0;
        let pad_y = (model_height - scaled_height) / 2.0;

        log(&format!("📐 letterbox: 元サイズ={}x{}, スケールサイズ={}x{}, パディング=({:.1}, {:.1}), スケール={:.4}",
                   img_width, img_height, scaled_width, scaled_height, pad_x, pad_y, scale));

        // まず元の画像をスケーリング
        let scaled = image::imageops::resize(
            image,
            scaled_width as u32,
            scaled_height as u32,
            image::imageops::FilterType::Triangle
        );

        // 640x640のキャンバスを作成（グレーのパディング）
        let mut letterboxed = RgbImage::new(self.width, self.height);
        for pixel in letterboxed.pixels_mut() {
            *pixel = image::Rgb([114, 114, 114]); // YOLOの標準的な背景色
        }

        // スケーリングした画像をキャンバスに貼り付け
        image::imageops::overlay(
            &mut letterboxed,
            &scaled,
            pad_x as i64,
            pad_y as i64
        );

        log(&format!("✅ letterboxリサイズ完了: 出力サイズ={}x{}", letterboxed.width(), letterboxed.height()));

        (letterboxed, scale, pad_x, pad_y)
    }

    // RGBImageを検出用に処理
    pub fn detect_image(&self, image: &RgbImage) -> Vec<Detection> {
        // 画像をテンソルに変換
        log("🔄 画像をテンソルに変換中...");
        let tensor = self.preprocess_image(image);
        log(&format!("✅ テンソル変換完了: 形状={:?}", tensor.shape()));

        // 検出実行
        match self.detect(tensor) {
            Ok(detections) => detections,
            Err(e) => {
                log(&format!("❌ 検出エラー: {:?}", e));
                Vec::new()
            }
        }
    }

    // 画像をテンソルに変換
    fn preprocess_image(&self, image: &RgbImage) -> Tensor {
        // 不要なデバッグログを削除
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
        log("💡 モデルを実行します");

        // 入力テンソルの形状をログ出力
        log(&format!("📊 入力テンソル形状: {:?}", image.shape()));

        let mut result = self.model.run(tvec!(image.into()))?;

        log("✅ モデル実行完了");

        // 出力テンソルの次元数をチェック
        if result.is_empty() {
            log("❌ モデルの出力が空です");
            return Ok(Vec::new());
        }

        // YOLOv11の出力形式を確認
        let output = result[0].to_array_view::<f32>()?;
        log(&format!("🔍 出力テンソル shape: {:?}", output.shape()));

        // 出力テンソルの次元数をチェック
        if output.shape().len() < 2 {
            log(&format!("❌ 出力形状が不正: {:?}", output.shape()));
            return Ok(Vec::new());
        }

        // YOLOv11出力形式の特徴量とボックス情報を特定
        let (num_classes, transposed) = self.determine_output_format(&output);

        log(&format!("📊 推定クラス数: {}, 転置形式: {}", num_classes, transposed));

        let mut detections = self.process_yolov11_output(&output, (self.height, self.width), num_classes, transposed);
        log(&format!("📦 NMS前の検出数: {}", detections.len()));
        Ok(self.non_max_suppression_improved(&mut detections, self.iou_threshold))
    }

    // 出力形式を特定する関数
    fn determine_output_format(&self, output: &ArrayView<f32, Dim<IxDynImpl>>) -> (usize, bool) {
        let shape = output.shape();

        // デフォルト値の設定
        let mut num_classes = 80; // COCOデータセットのデフォルトクラス数
        let mut transposed = false;

        if shape.len() == 3 {
            // 形式1: [batch, num_classes+4, num_boxes]
            if shape[1] > 4 && shape[2] > 0 {
                num_classes = shape[1] - 4;
                transposed = false;
            }
            // 形式2: [batch, num_boxes, num_classes+4]
            else if shape[1] > 0 && shape[2] > 4 {
                num_classes = shape[2] - 4;
                transposed = true;
            }
        }

        (num_classes, transposed)
    }

    // YOLOv11標準出力形式 [batch, features, predictions] を処理する
    pub fn process_yolov11_output(&self, model_output: &ArrayView<f32, Dim<IxDynImpl>>, img_shape: (u32, u32), num_classes: usize, transposed: bool) -> Vec<Detection> {
        let (img_height, img_width) = img_shape;
        let batch = 0; // バッチは常に0（単一画像）
        let mut detections = Vec::new();

        let num_predictions = model_output.shape()[2];

        // 各予測を処理 - これはYOLOv11の全ての検出候補（通常数千個）を処理します
        let mut candidate_detections = Vec::with_capacity(num_predictions);

        // 各予測ごとに処理
        for p in 0..num_predictions {
            // バウンディングボックス情報
            let (x, y, w, h) = if !transposed {
                (
                    model_output[[batch, 0, p]],
                    model_output[[batch, 1, p]],
                    model_output[[batch, 2, p]],
                    model_output[[batch, 3, p]],
                )
            } else {
                (
                    model_output[[batch, p, 0]],
                    model_output[[batch, p, 1]],
                    model_output[[batch, p, 2]],
                    model_output[[batch, p, 3]],
                )
            };

            // クラス信頼度
            let mut max_class_conf = 0.0;
            let mut max_class_idx = 0;
            if !transposed {
                for c in 0..num_classes {
                    let class_score = model_output[[batch, 4 + c, p]];
                    if class_score > max_class_conf {
                        max_class_conf = class_score;
                        max_class_idx = c;
                    }
                }
            } else {
                for c in 0..num_classes {
                    let class_score = model_output[[batch, p, 4 + c]];
                    if class_score > max_class_conf {
                        max_class_conf = class_score;
                        max_class_idx = c;
                    }
                }
            }

            if max_class_conf >= self.confidence_threshold {
                let left = (x - w / 2.0).max(0.0).min(img_width as f32);
                let top = (y - h / 2.0).max(0.0).min(img_height as f32);
                let right = (x + w / 2.0).max(0.0).min(img_width as f32);
                let bottom = (y + h / 2.0).max(0.0).min(img_height as f32);

                // 画像内に収める
                let left = left.max(0.0).min(img_width as f32);
                let top = top.max(0.0).min(img_height as f32);
                let right = right.max(0.0).min(img_width as f32);
                let bottom = bottom.max(0.0).min(img_height as f32);

                let box_width = right - left;
                let box_height = bottom - top;

                // バウンディングボックスの検証
                let valid_box = box_width > 5.0 && box_height > 5.0 &&
                               box_width < img_width as f32 * 0.95 &&
                               box_height < img_height as f32 * 0.95 &&
                               max_class_idx < self.classes.len();

                if valid_box {
                    // 候補リストに追加
                    candidate_detections.push((
                        max_class_idx,
                        max_class_conf,
                        left as u32,
                        top as u32,
                        right as u32,
                        bottom as u32
                    ));
                }
            }
        }

        // 信頼度でソート（降順）
        candidate_detections.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        // 信頼度閾値以上の検出だけを最終リストに追加（上限100個まで）
        let filtered_detections: Vec<_> = candidate_detections.iter()
            .filter(|(_, confidence, _, _, _, _)| *confidence >= self.confidence_threshold)
            .take(100)
            .collect();

        for &(class_id, confidence, x1, y1, x2, y2) in &filtered_detections {
            let detection = Detection {
                class_id: *class_id as u32,
                class_name: self.classes[*class_id].clone(),
                confidence: *confidence,
                x1: *x1,
                y1: *y1,
                x2: *x2,
                y2: *y2,
            };

            detections.push(detection);
        }

        log(&format!("NMS前に{}個の候補オブジェクトを検出しました", detections.len()));
        detections
    }

    // 改良版NMS - 異なるオブジェクトの区別を改善
    fn non_max_suppression_improved(&self, detections: &mut Vec<Detection>, iou_threshold: f32) -> Vec<Detection> {
        log(&format!("🔍 非最大抑制を実行: 候補数={}, IoU閾値={}", detections.len(), iou_threshold));

        // 検出結果が空の場合は早期リターン
        if detections.is_empty() {
            return Vec::new();
        }

        // 信頼度スコアでソート（降順）
        detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

        let mut keep = vec![true; detections.len()];
        let mut nms_count = 0;

        for i in 0..detections.len() {
            if !keep[i] {
                continue;
            }

            // NMSの処理
            for j in i+1..detections.len() {
                if !keep[j] || detections[i].class_id != detections[j].class_id {
                    continue;
                }

                // 2つのバウンディングボックス間のIoUを計算
                let iou = self.calculate_iou(&detections[i], &detections[j]);

                // IoUが閾値を超えたら、低い信頼度の方を除外
                if iou > iou_threshold {
                    // オーバーラップが大きい場合は低信頼度の検出を除外
                    keep[j] = false;
                    nms_count += 1;
                    log(&format!("🔍 NMS: 重複を除外 - IoU={:.3} > 閾値={}", iou, iou_threshold));
                }
            }
        }

        // keep=trueの検出だけを保持
        let result: Vec<Detection> = detections.iter()
            .zip(keep.iter())
            .filter_map(|(detection, &k)| if k { Some(detection.clone()) } else { None })
            .collect();

        log(&format!("NMS後に{}個のオブジェクトを検出しました ({}個除外)", result.len(), nms_count));

        // 残った検出結果をログ出力
        for (i, det) in result.iter().enumerate() {
            log(&format!("検出結果#{}: クラス={}({}), 信頼度={:.3}, 座標=[{}, {}, {}, {}]",
                i+1, det.class_id, det.class_name, det.confidence, det.x1, det.y1, det.x2, det.y2));
        }

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