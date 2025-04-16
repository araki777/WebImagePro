use image::{DynamicImage, GenericImageView};
use ndarray::{Array, ArrayD, Axis, IxDyn};
use std::path::Path;
use tract_onnx::prelude::*;

pub struct YoloDetection {
    pub class_id: usize,
    pub confidence: f32,
    pub bbox: [f32; 4], // [x1, y1, x2, y2]
}

pub struct YoloModel {
    model: TypedRunnableModel<TypedFact, Box<dyn TypedOp>, Graph<TypedFact, Box<dyn TypedOp>>>,
    input_shape: [usize; 2], // height, width
    confidence_threshold: f32,
    iou_threshold: f32,
    class_names: Vec<String>,
}

impl YoloModel {
    pub fn new(
        model_path: &Path,
        input_height: usize,
        input_width: usize,
        confidence_threshold: f32,
        iou_threshold: f32,
    ) -> Result<Self, anyhow::Error> {
        let model = tract_onnx::onnx()
            .model_for_path(model_path)?
            .into_optimized()?
            .into_runnable()?;

        // デフォルトのCOCOクラス名
        let class_names = vec![
            "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
            "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
            "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
            "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
            "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
            "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
            "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
            "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote",
            "keyboard", "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book",
            "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
        ].into_iter().map(String::from).collect();

        Ok(YoloModel {
            model,
            input_shape: [input_height, input_width],
            confidence_threshold,
            iou_threshold,
            class_names,
        })
    }

    pub fn detect(&self, image: &DynamicImage) -> Result<Vec<YoloDetection>, anyhow::Error> {
        let (img_height, img_width) = (image.height() as f32, image.width() as f32);
        let input = self.prepare_input(image)?;

        // 推論実行
        let outputs = self.model.run(tvec!(input))?;
        let output = outputs[0].to_array_view::<f32>()?;

        // 検出結果の解析
        let mut detections = self.process_output(output, img_width, img_height)?;

        // 非最大抑制の適用
        detections = self.apply_nms(detections)?;

        Ok(detections)
    }

    fn prepare_input(&self, image: &DynamicImage) -> Result<Tensor, anyhow::Error> {
        let resized = image.resize_exact(
            self.input_shape[1] as u32,
            self.input_shape[0] as u32,
            image::imageops::FilterType::Triangle
        );

        let mut input_tensor = Array::zeros(IxDyn(&[1, 3, self.input_shape[0], self.input_shape[1]]));

        // RGB画像をBGRに変換し、正規化
        for y in 0..self.input_shape[0] {
            for x in 0..self.input_shape[1] {
                let pixel = resized.get_pixel(x as u32, y as u32);
                // RGB -> BGR, 0-255 -> 0-1
                input_tensor[[0, 2, y, x]] = pixel[0] as f32 / 255.0;
                input_tensor[[0, 1, y, x]] = pixel[1] as f32 / 255.0;
                input_tensor[[0, 0, y, x]] = pixel[2] as f32 / 255.0;
            }
        }

        Ok(input_tensor.into_dyn().into())
    }

    fn process_output(
        &self,
        output: ndarray::ArrayView<f32, ndarray::Dim<IxDyn>>,
        img_width: f32,
        img_height: f32
    ) -> Result<Vec<YoloDetection>, anyhow::Error> {
        let mut detections = Vec::new();

        // YOLOv8出力フォーマットに基づく処理
        // 出力は (1, 84, num_boxes) または (1, num_boxes, 84) の形状を想定

        let output_shape = output.shape();
        let (rows, cols) = if output_shape[1] > output_shape[2] {
            (output_shape[2], output_shape[1])
        } else {
            (output_shape[1], output_shape[2])
        };

        let num_classes = cols - 4; // 最初の4要素はバウンディングボックス

        for i in 0..rows {
            let box_data = if output_shape[1] > output_shape[2] {
                output.slice(s![0, .., i])
            } else {
                output.slice(s![0, i, ..])
            };

            // 信頼度スコアと対応するクラスを取得
            let mut max_score = 0.0;
            let mut class_id = 0;

            for c in 0..num_classes {
                let score = box_data[c + 4]; // 最初の4要素はバウンディングボックス
                if score > max_score {
                    max_score = score;
                    class_id = c;
                }
            }

            if max_score < self.confidence_threshold {
                continue;
            }

            // バウンディングボックスの座標取得
            let x = box_data[0];
            let y = box_data[1];
            let w = box_data[2];
            let h = box_data[3];

            // 画像の元のサイズに合わせてバウンディングボックスを調整
            let x1 = (x - w / 2.0) * img_width;
            let y1 = (y - h / 2.0) * img_height;
            let x2 = (x + w / 2.0) * img_width;
            let y2 = (y + h / 2.0) * img_height;

            detections.push(YoloDetection {
                class_id,
                confidence: max_score,
                bbox: [x1, y1, x2, y2],
            });
        }

        Ok(detections)
    }

    fn apply_nms(&self, mut detections: Vec<YoloDetection>) -> Result<Vec<YoloDetection>, anyhow::Error> {
        detections.sort_by(|a, b| b.confidence.partial_cmp(&a.confidence).unwrap());

        let mut result = Vec::new();
        let mut selected_indices = vec![false; detections.len()];

        for i in 0..detections.len() {
            if selected_indices[i] {
                continue;
            }

            result.push(detections[i].clone());
            selected_indices[i] = true;

            for j in (i + 1)..detections.len() {
                if selected_indices[j] {
                    continue;
                }

                if detections[i].class_id == detections[j].class_id {
                    let iou = self.calculate_iou(&detections[i].bbox, &detections[j].bbox);
                    if iou > self.iou_threshold {
                        selected_indices[j] = true;
                    }
                }
            }
        }

        Ok(result)
    }

    fn calculate_iou(&self, box1: &[f32; 4], box2: &[f32; 4]) -> f32 {
        let [x1_1, y1_1, x2_1, y2_1] = *box1;
        let [x1_2, y1_2, x2_2, y2_2] = *box2;

        let x1 = x1_1.max(x1_2);
        let y1 = y1_1.max(y1_2);
        let x2 = x2_1.min(x2_2);
        let y2 = y2_1.min(y2_2);

        let intersection_area = (x2 - x1).max(0.0) * (y2 - y1).max(0.0);
        let box1_area = (x2_1 - x1_1) * (y2_1 - y1_1);
        let box2_area = (x2_2 - x1_2) * (y2_2 - y1_2);

        intersection_area / (box1_area + box2_area - intersection_area)
    }

    pub fn get_class_name(&self, class_id: usize) -> Option<&str> {
        self.class_names.get(class_id).map(|s| s.as_str())
    }
}

impl Clone for YoloDetection {
    fn clone(&self) -> Self {
        YoloDetection {
            class_id: self.class_id,
            confidence: self.confidence,
            bbox: self.bbox,
        }
    }
}
