import os
import pytest
import numpy as np
from PIL import Image, ImageDraw
from ai_ml.inference.detect_hazards_cv import cv_detector

@pytest.fixture
def sample_crack_image(tmp_path):
    img_path = str(tmp_path / "test_crack.jpg")
    img = Image.new("RGB", (400, 300), color=(200, 200, 200))
    draw = ImageDraw.Draw(img)
    # Draw dark elongated crack fissure
    draw.line([(50, 40), (120, 100), (180, 140), (280, 220), (350, 260)], fill=(20, 20, 20), width=10)
    draw.line([(180, 140), (220, 180), (250, 240)], fill=(30, 30, 30), width=6)
    img.save(img_path)
    return img_path

@pytest.fixture
def sample_debris_image(tmp_path):
    img_path = str(tmp_path / "test_debris.jpg")
    # Earth brown tone (R=130, G=85, B=45)
    img = Image.new("RGB", (400, 300), color=(130, 85, 45))
    img.save(img_path)
    return img_path

@pytest.fixture
def sample_clean_image(tmp_path):
    img_path = str(tmp_path / "test_clean.jpg")
    img = Image.new("RGB", (400, 300), color=(180, 180, 180))
    img.save(img_path)
    return img_path

def test_crack_detection(sample_crack_image):
    analysis = cv_detector.analyze_image(sample_crack_image)
    assert analysis["is_blurred"] is False
    assert analysis["crack_analysis"]["detected"] is True
    assert analysis["crack_analysis"]["max_width_px"] > 0.0
    detected_classes = [d["class_name"] for d in analysis["detected_hazards"]]
    assert "ground_crack" in detected_classes
    assert analysis["inferred_severity"] in ["HIGH", "CRITICAL"]

def test_debris_flow_detection(sample_debris_image):
    analysis = cv_detector.analyze_image(sample_debris_image)
    detected_classes = [d["class_name"] for d in analysis["detected_hazards"]]
    assert any(c in detected_classes for c in ["debris_flow", "blocked_road"])

def test_clean_road_image(sample_clean_image):
    analysis = cv_detector.analyze_image(sample_clean_image)
    assert analysis["crack_analysis"]["detected"] is False
    assert analysis["inferred_severity"] == "LOW"
    assert analysis["cv_status"] == "NORMAL"
