# ============================================================================
# Solution 4.5 — Image Processing
# ============================================================================
# Represent images as NumPy arrays, implement basic image operations:
# flipping, cropping, grayscale conversion, and padding.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# Helper: create a small synthetic RGB image for testing
# ---------------------------------------------------------------------------

def make_test_image(height=8, width=10):
    """Create an (H, W, 3) uint8 image with known pixel values."""
    np.random.seed(42)
    return np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)

# ---------------------------------------------------------------------------
# 1. Flip operations
# ---------------------------------------------------------------------------

def flip_horizontal(img):
    """Flip image left-right."""
    return img[:, ::-1, :]

def flip_vertical(img):
    """Flip image top-bottom."""
    return img[::-1, :, :]

# ---------------------------------------------------------------------------
# 2. Crop
# ---------------------------------------------------------------------------

def crop(img, row_start, row_end, col_start, col_end):
    """Crop img to rows [row_start:row_end] and cols [col_start:col_end]."""
    return img[row_start:row_end, col_start:col_end, :]

# ---------------------------------------------------------------------------
# 3. Grayscale conversion
# ---------------------------------------------------------------------------

def to_grayscale(img):
    """Convert RGB image to grayscale using weighted average:
    gray = 0.2989*R + 0.5870*G + 0.1140*B
    """
    weights = np.array([0.2989, 0.5870, 0.1140])
    return img.astype(float) @ weights

# ---------------------------------------------------------------------------
# 4. Padding
# ---------------------------------------------------------------------------

def pad_image(img, pad_width, constant=0):
    """Pad img with 'pad_width' pixels of 'constant' on all sides."""
    return np.pad(img,
                  ((pad_width, pad_width), (pad_width, pad_width), (0, 0)),
                  mode='constant',
                  constant_values=constant)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    img = make_test_image(8, 10)
    H, W, C = img.shape  # 8, 10, 3

    # flip_horizontal
    flipped_h = flip_horizontal(img)
    assert flipped_h is not None, "flip_horizontal must return a value"
    assert flipped_h.shape == img.shape, "flip_horizontal should preserve shape"
    assert np.all(flipped_h[:, 0, :] == img[:, -1, :]), "first col should equal last col of original"
    assert np.all(flipped_h[:, -1, :] == img[:, 0, :]), "last col should equal first col of original"

    # flip_vertical
    flipped_v = flip_vertical(img)
    assert flipped_v is not None, "flip_vertical must return a value"
    assert flipped_v.shape == img.shape, "flip_vertical should preserve shape"
    assert np.all(flipped_v[0, :, :] == img[-1, :, :]), "first row should equal last row of original"
    assert np.all(flipped_v[-1, :, :] == img[0, :, :]), "last row should equal first row of original"

    # crop
    cropped = crop(img, 2, 5, 3, 8)
    assert cropped is not None, "crop must return a value"
    assert cropped.shape == (3, 5, 3), f"Expected (3,5,3), got {cropped.shape}"
    assert np.all(cropped == img[2:5, 3:8, :]), "cropped content wrong"

    # to_grayscale
    gray = to_grayscale(img)
    assert gray is not None, "to_grayscale must return a value"
    assert gray.shape == (H, W), f"Expected ({H},{W}), got {gray.shape}"
    expected_px = 0.2989 * img[0, 0, 0] + 0.5870 * img[0, 0, 1] + 0.1140 * img[0, 0, 2]
    assert np.isclose(gray[0, 0], expected_px, atol=0.5), \
        f"gray[0,0] should be ~{expected_px:.2f}, got {gray[0,0]:.2f}"

    # pad_image
    padded = pad_image(img, 2, constant=0)
    assert padded is not None, "pad_image must return a value"
    assert padded.shape == (H + 4, W + 4, C), f"Expected ({H+4},{W+4},{C}), got {padded.shape}"
    assert np.all(padded[:2, :, :] == 0), "top 2 rows should be padded with 0"
    assert np.all(padded[-2:, :, :] == 0), "bottom 2 rows should be padded with 0"
    assert np.all(padded[2:-2, 2:-2, :] == img), "inner region should match original"

    print("Solution 4.5 — All assertions passed!")

if __name__ == "__main__":
    main()
