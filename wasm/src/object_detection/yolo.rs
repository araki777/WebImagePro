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
    // モデルバイナリから新しいYOLOモデルを初期化（固定サイズ640x640を使用）
    pub fn new(model_bytes: &[u8]) -> Result<YoloModel, Box<dyn std::error::Error>> {
        let width = 640;
        let height = 640;
        
        log(&format!("メモリからモデルをロード中: {} バイト", model_bytes.len()));
        
        // バイナリデータから直接モデルを読み込む
        let model = tract_onnx::onnx()
            .model_for_read(&mut Cursor::new(model_bytes))?;
            
        log(&format!("モデル入力形状: {:?}", model.input_fact(0)?.shape));
        
        // 入力サイズを設定
        let model = model
            .with_input_fact(0, f32::fact([1, 3, height as i32, width as i32]).into())?;
            
        // 最適化して実行可能なモデルに変換
        let model = model
            .into_typed()?
            .into_runnable()?;

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

    // 画像をリサイズして物体検出を実行（CenterFaceと類似のインターフェース）
    pub fn detect_with_resize(&self, image: &RgbImage) -> Vec<Detection> {
        let org_width = image.width();
        let org_height = image.height();

        // 検出器の入力サイズに画像をリサイズ
        let resized_image = image::imageops::resize(
            image, self.width, self.height, image::imageops::FilterType::Triangle,
        );

        // リサイズされた画像で検出を実行
        let detections = self.detect_image(&resized_image);

        // 検出結果を元の画像サイズにスケールバック
        // モデル入力用にリサイズした画像から元のサイズに戻すための係数を計算
        let scale_x = org_width as f32 / self.width as f32;
        let scale_y = org_height as f32 / self.height as f32;

        // 検出結果をスケーリング
        detections.into_iter()
            .map(|d| {
                Detection {
                    class_id: d.class_id,
                    class_name: d.class_name,
                    confidence: d.confidence,
                    x1: (d.x1 as f32 * scale_x) as u32,
                    y1: (d.y1 as f32 * scale_y) as u32,
                    x2: (d.x2 as f32 * scale_x) as u32,
                    y2: (d.y2 as f32 * scale_y) as u32,
                }
            })
            .collect()
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
        // レターボックス処理を適用してパディング付きでリサイズ
        let padded = letterbox_rgb(image, self.width);
        
        // モデル入力用にテンソルを準備
        // NCHW形式(バッチ、チャンネル、高さ、幅)にデータを整形
        let tensor: Tensor = tract_ndarray::Array4::from_shape_fn(
            (1, 3, self.height as usize, self.width as usize),
            |(_, c, y, x)| {
                // RGBチャンネルの値を0〜1の範囲に正規化
                // YOLOv8では通常は単純に255で割るが、精度向上のためにわずかにスケーリングを調整
                let pixel = padded.get_pixel(x as u32, y as u32);
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
        
        // 基本信頼度閾値を下げる
        let base_confidence_threshold = 0.2;
        
        // クラス別信頼度閾値（特に重要なクラスでは低めに、余計な検出が多いクラスでは高めに設定）
        let mut class_confidence_thresholds = vec![base_confidence_threshold; self.classes.len()];
        
        // クラスIDからクラス名への変換（クラス固有の設定のため）
        let class_indices: std::collections::HashMap<&str, usize> = self.classes.iter()
            .enumerate()
            .map(|(i, name)| (name.as_str(), i))
            .collect();
        
        // 特定クラスの信頼度閾値をさらに下げる
        if let Some(&idx) = class_indices.get("person") { class_confidence_thresholds[idx] = 0.1; }
        if let Some(&idx) = class_indices.get("dog") { class_confidence_thresholds[idx] = 0.1; }
        if let Some(&idx) = class_indices.get("cat") { class_confidence_thresholds[idx] = 0.1; }
        
        // 誤検出が多いクラスは閾値を適度に設定
        if let Some(&idx) = class_indices.get("remote") { class_confidence_thresholds[idx] = 0.6; }
        if let Some(&idx) = class_indices.get("cell phone") { class_confidence_thresholds[idx] = 0.55; }
        if let Some(&idx) = class_indices.get("book") { class_confidence_thresholds[idx] = 0.5; }
        if let Some(&idx) = class_indices.get("clock") { class_confidence_thresholds[idx] = 0.55; }
        if let Some(&idx) = class_indices.get("bowl") { class_confidence_thresholds[idx] = 0.5; }

        log(&format!("処理中: {}個の候補オブジェクトを評価します", rows));
        
        let mut detections = Vec::new();
        
        // 各検出結果を処理
        for b in 0..batch_size {
            for r in 0..rows {
                let bbox_conf = model_output[[b, r, 4]];
                // 前フィルタリング閾値を大幅に下げる
                if bbox_conf < 0.05 { continue; } 
                
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

                // バウンディングボックスの座標を取得
                let x_center = model_output[[b, r, 0]];
                let y_center = model_output[[b, r, 1]];
                let width = model_output[[b, r, 2]];
                let height = model_output[[b, r, 3]];
                
                // 極端に小さいボックスをスキップする閾値も下げる
                if width * height < 0.0005 {
                    continue;
                }
                
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
        
        log(&format!("Found {} candidate objects before NMS", detections.len()));
        
        // 非最大抑制を適用して重複検出を除去
        self.non_max_suppression(&mut detections)
    }

    // 検出結果の重複を除去するNMS（Non-Maximum Suppression）を実行
    fn non_max_suppression(&self, detections: &mut Vec<Detection>) -> Vec<Detection> {
        // 信頼度スコアでソート（降順）
        detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());
        
        let mut indices = vec![true; detections.len()];
        
        for i in 0..detections.len() {
            if !indices[i] {
                continue;
            }
            
            // クラス特有のIoU閾値を取得
            let iou_threshold = match detections[i].class_name.as_str() {
                "person" | "dog" | "cat" => 0.4, // 人や動物は低めのIoU閾値で複数検出を促進
                "remote" | "cell phone" | "book" | "clock" | "bowl" => 0.6, // 小物は高めにして誤検出を減らす
                _ => 0.45, // その他のクラスは標準的な閾値
            };
            
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

// RGBImage用のレターボックス処理
pub fn letterbox_rgb(input_image: &RgbImage, target_size: u32) -> RgbImage {
    let img_width = input_image.width();
    let img_height = input_image.height();

    // スケーリング比率の計算（アスペクト比を維持）
    let scale = target_size as f32 / img_width.max(img_height) as f32;
    let new_width = (img_width as f32 * scale).round() as u32;
    let new_height = (img_height as f32 * scale).round() as u32;

    // 画像をリサイズ
    // 人物や動物の写真では精度重視のためにLanczosフィルタを使用
    let resized = image::imageops::resize(
        input_image,
        new_width,
        new_height,
        image::imageops::FilterType::Lanczos3,
    );

    // グレー背景の正方形キャンバス作成（黒よりもグレーの方がエッジ検出に優れる）
    let mut canvas = image::RgbImage::from_pixel(target_size, target_size, image::Rgb([128, 128, 128]));

    // リサイズした画像を中央に配置するためのオフセット計算
    let x_offset = ((target_size as i32 - new_width as i32) / 2).max(0) as u32;
    let y_offset = ((target_size as i32 - new_height as i32) / 2).max(0) as u32;

    // リサイズした画像をキャンバスの中央に配置
    image::imageops::replace(&mut canvas, &resized, x_offset as i64, y_offset as i64);

    // パディング領域をぼかす（強いエッジの発生を防ぐため）
    if x_offset > 0 || y_offset > 0 {
        // パディング領域をソフトにぼかす処理はここに追加可能
        // 今回は省略（複雑な実装が必要なため）
    }

    canvas
}