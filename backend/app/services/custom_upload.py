import io
import base64
import numpy as np
import cv2
from typing import Dict, Any, Tuple
from PIL import Image

class CustomImageProcessor:
    """
    Processes user-supplied pre-event and post-event images (satellite or aerial),
    performs alignment, color difference detection, Otsu thresholding,
    and returns flood segmentation masks with area statistics.
    """
    
    @staticmethod
    def read_image_bytes(image_bytes: bytes) -> np.ndarray:
        """Decodes raw image bytes into a BGR numpy array using PIL and OpenCV."""
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_img)
        # Convert RGB to BGR for OpenCV
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        return img_bgr

    @staticmethod
    def process_image_pair(
        pre_bytes: bytes,
        post_bytes: bytes,
        sensitivity: float = 1.0
    ) -> Dict[str, Any]:
        """
        Runs change detection and flood/sediment segmentation on custom image pairs.
        """
        pre_img = CustomImageProcessor.read_image_bytes(pre_bytes)
        post_img = CustomImageProcessor.read_image_bytes(post_bytes)
        
        # 1. Resize post image to match pre image dimensions
        h, w = pre_img.shape[:2]
        post_resized = cv2.resize(post_img, (w, h), interpolation=cv2.INTER_AREA)
        
        # 2. Convert to grayscale and blur to suppress noise
        pre_gray = cv2.cvtColor(pre_img, cv2.COLOR_BGR2GRAY)
        post_gray = cv2.cvtColor(post_resized, cv2.COLOR_BGR2GRAY)
        
        pre_blur = cv2.GaussianBlur(pre_gray, (5, 5), 0)
        post_blur = cv2.GaussianBlur(post_gray, (5, 5), 0)
        
        # 3. Absolute difference and relative luminance drop
        diff = cv2.absdiff(pre_blur, post_blur)
        
        # Inundation detection: flood water reduces surface brightness and changes hue
        # Also compute HSV saturation/value change
        pre_hsv = cv2.cvtColor(pre_img, cv2.COLOR_BGR2HSV)
        post_hsv = cv2.cvtColor(post_resized, cv2.COLOR_BGR2HSV)
        
        val_diff = cv2.absdiff(pre_hsv[:, :, 2], post_hsv[:, :, 2])
        combined_diff = cv2.addWeighted(diff, 0.6, val_diff, 0.4, 0)
        
        # 4. Otsu adaptive thresholding scaled by sensitivity factor
        _, otsu_mask = cv2.threshold(combined_diff, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        if sensitivity != 1.0:
            threshold_val = int(35 / max(sensitivity, 0.2))
            _, otsu_mask = cv2.threshold(combined_diff, threshold_val, 255, cv2.THRESH_BINARY)
            
        # 5. Morphological cleaning (sieve noise filter)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        clean_mask = cv2.morphologyEx(otsu_mask, cv2.MORPH_OPEN, kernel)
        clean_mask = cv2.morphologyEx(clean_mask, cv2.MORPH_CLOSE, kernel)
        
        # 6. Generate color overlay: Semi-transparent blue/cyan over post image
        overlay = post_resized.copy()
        # Colorize flooded pixels as bright electric blue [B=235, G=99, R=37]
        blue_mask = np.zeros_like(overlay)
        blue_mask[clean_mask > 0] = [235, 120, 30] # BGR
        
        cv2.addWeighted(blue_mask, 0.6, overlay, 0.8, 0, overlay)
        
        # Draw red contours around inundated zones
        contours, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(overlay, contours, -1, (0, 0, 255), 2)
        
        # 7. Compute statistics
        total_pixels = h * w
        flood_pixels = int(np.sum(clean_mask > 0))
        percentage = round((flood_pixels / total_pixels) * 100.0, 2)
        
        # Approximate area estimation (assuming standard 10m/pixel if uncalibrated)
        est_area_m2 = flood_pixels * (10.0 * 10.0)
        est_area_km2 = round(est_area_m2 / 1_000_000.0, 3)
        est_hectares = round(est_area_m2 / 10_000.0, 2)
        
        # 8. Encode outputs to Base64 Data URIs
        def to_base64_uri(bgr_array: np.ndarray) -> str:
            rgb = cv2.cvtColor(bgr_array, cv2.COLOR_BGR2RGB)
            pil = Image.fromarray(rgb)
            buf = io.BytesIO()
            pil.save(buf, format="JPEG", quality=85)
            encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
            return f"data:image/jpeg;base64,{encoded}"

        def mask_to_base64_uri(gray_mask: np.ndarray) -> str:
            pil = Image.fromarray(gray_mask)
            buf = io.BytesIO()
            pil.save(buf, format="PNG")
            encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
            return f"data:image/png;base64,{encoded}"

        return {
            "inundated_pixels": flood_pixels,
            "total_pixels": total_pixels,
            "inundated_percentage": percentage,
            "estimated_area_km2": est_area_km2,
            "estimated_hectares": est_hectares,
            "dimensions": {"width": w, "height": h},
            "overlay_image_uri": to_base64_uri(overlay),
            "binary_mask_uri": mask_to_base64_uri(clean_mask)
        }
