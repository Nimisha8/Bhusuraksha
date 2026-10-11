import os
import uuid
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from ai_ml.inference.detect_hazards_cv import cv_detector
from backend.app.services.gis_service import gis_service

class ComputerVisionService:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        self.uploads_dir = os.path.join(self.base_dir, "uploads")
        os.makedirs(self.uploads_dir, exist_ok=True)
        self.detector = cv_detector

    def save_upload_file(self, file_bytes: bytes, original_filename: str) -> str:
        """Saves uploaded image bytes securely with a unique filename."""
        ext = os.path.splitext(original_filename)[1] or ".jpg"
        unique_name = f"report_{uuid.uuid4()}{ext}"
        target_path = os.path.join(self.uploads_dir, unique_name)
        with open(target_path, "wb") as f:
            f.write(file_bytes)
        return target_path

    def process_report_image(
        self, 
        image_path: str,
        latitude: float,
        longitude: float
    ) -> Dict[str, Any]:
        """
        Runs computer vision analysis on report photo, evaluates hazard severity,
        and dynamically updates nearby road segment status if a blockage is confirmed.
        """
        analysis = self.detector.analyze_image(image_path)
        
        # If road blockage detected, automatically flag nearest road segment in GIS
        road_analysis = analysis.get("road_blockage_analysis", {})
        if road_analysis.get("is_blocked"):
            nearest_road = gis_service.find_nearest_road_segment(latitude, longitude)
            if nearest_road:
                gis_service.update_road_status(nearest_road["id"], "BLOCKED")
                analysis["road_action_taken"] = f"Arterial segment {nearest_road['name']} ({nearest_road['road_code']}) automatically marked as BLOCKED."

        return analysis

cv_service = ComputerVisionService()
