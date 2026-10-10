import io
import pytest
from PIL import Image
from app.services.custom_upload import CustomImageProcessor

def test_custom_image_processor():
    # Create two synthetic RGB images (pre and post)
    img_pre = Image.new("RGB", (100, 100), color=(50, 100, 50))
    # Post has a flooded dark blue channel in the center
    img_post = Image.new("RGB", (100, 100), color=(50, 100, 50))
    for x in range(40, 60):
        for y in range(100):
            img_post.putpixel((x, y), (10, 20, 180))

    pre_buf = io.BytesIO()
    img_pre.save(pre_buf, format="PNG")
    pre_bytes = pre_buf.getvalue()

    post_buf = io.BytesIO()
    img_post.save(post_buf, format="PNG")
    post_bytes = post_buf.getvalue()

    result = CustomImageProcessor.process_image_pair(pre_bytes, post_bytes, sensitivity=1.0)

    assert "inundated_pixels" in result
    assert result["inundated_pixels"] > 0
    assert result["inundated_percentage"] > 0.0
    assert result["overlay_image_uri"].startswith("data:image/jpeg;base64,")
    assert result["binary_mask_uri"].startswith("data:image/png;base64,")
