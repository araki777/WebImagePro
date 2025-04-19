import os

from ultralytics import YOLO

current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "models", "yolo11n.pt")
model = YOLO(model_path)

model.export(format="onnx", imgsz=[640, 640])