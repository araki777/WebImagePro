import os

from ultralytics import YOLO

current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "models", "yolov8n.pt")
model = YOLO(model_path)

# 固定サイズ(640x640)でエクスポート - 動的サイズではなく静的サイズを使用
model.export(format="onnx", imgsz=640)