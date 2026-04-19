# ============================================================================
# Examples 4.5 — Image Processing  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

np.random.seed(42)

# --- BASIC ---

# 1. create synthetic RGB image
img = np.random.randint(0, 256, (8, 10, 3), dtype=np.uint8)
print("Ex01 image shape:", img.shape, "dtype:", img.dtype)

# 2. access a single pixel
print("Ex02 pixel [2,3]:", img[2, 3])  # RGB values

# 3. access a single channel
print("Ex03 red channel shape:", img[:, :, 0].shape)

# 4. grayscale conversion
gray = img.astype(float) @ np.array([0.2989, 0.5870, 0.1140])
print("Ex04 grayscale shape:", gray.shape)

# 5. flip horizontal (left-right)
flipped_h = img[:, ::-1, :]
print("Ex05 first col == original last col:", np.all(flipped_h[:, 0, :] == img[:, -1, :]))

# 6. flip vertical (top-bottom)
flipped_v = img[::-1, :, :]
print("Ex06 first row == original last row:", np.all(flipped_v[0, :, :] == img[-1, :, :]))

# 7. rotate 90 degrees (np.rot90)
rot90 = np.rot90(img)
print("Ex07 rot90 shape:", rot90.shape)  # (10, 8, 3) — axes 0,1 swapped

# 8. rotate 180 degrees
rot180 = np.rot90(img, k=2)
print("Ex08 rot180 same as flip both:", np.all(rot180 == img[::-1, ::-1, :]))

# 9. crop
cropped = img[2:6, 3:8, :]
print("Ex09 cropped shape:", cropped.shape)  # (4, 5, 3)

# 10. pad with zeros
padded = np.pad(img, ((2, 2), (2, 2), (0, 0)), mode='constant', constant_values=0)
print("Ex10 padded shape:", padded.shape)  # (12, 14, 3)

# 11. pad with reflection
padded_r = np.pad(img, ((1, 1), (1, 1), (0, 0)), mode='reflect')
print("Ex11 reflect padded shape:", padded_r.shape)

# 12. resize by integer factor (upscale 2x using repeat)
upscaled = np.repeat(np.repeat(img, 2, axis=0), 2, axis=1)
print("Ex12 upscaled shape:", upscaled.shape)  # (16, 20, 3)

# 13. downscale by averaging 2x2 blocks
h, w, c = img.shape
ds_h, ds_w = h//2, w//2
blocks = img[:ds_h*2, :ds_w*2, :].reshape(ds_h, 2, ds_w, 2, c)
downscaled = blocks.mean(axis=(1, 3)).astype(np.uint8)
print("Ex13 downscaled shape:", downscaled.shape)  # (4, 5, 3)

# 14. brightness adjustment (clip to [0,255])
bright = np.clip(img.astype(int) + 50, 0, 255).astype(np.uint8)
print("Ex14 brightened min:", bright.min(), "max:", bright.max())

# 15. contrast adjustment
contrast = np.clip((img.astype(float) - 128) * 1.5 + 128, 0, 255).astype(np.uint8)
print("Ex15 contrast adjusted std:", contrast.std().round(2))

# --- INTERMEDIATE ---

# 16. histogram equalization concept (grayscale)
hist, bins = np.histogram(gray.flatten(), bins=256, range=(0, 256))
cdf = hist.cumsum()
cdf_norm = (cdf - cdf.min()) * 255 / (cdf.max() - cdf.min())
print("Ex16 equalized range:", cdf_norm.min().round(), cdf_norm.max().round())

# 17. edge detection with Sobel filter
def sobel(img_g):
    Kx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=float)
    Ky = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=float)
    def apply_filter(I, K):
        h, w = I.shape
        kh, kw = K.shape
        out = np.zeros((h-kh+1, w-kw+1))
        for i in range(out.shape[0]):
            for j in range(out.shape[1]):
                out[i,j] = np.sum(I[i:i+kh, j:j+kw] * K)
        return out
    Gx = apply_filter(img_g, Kx)
    Gy = apply_filter(img_g, Ky)
    return np.sqrt(Gx**2 + Gy**2)
gray_large = np.random.rand(10, 10)
edges = sobel(gray_large)
print("Ex17 Sobel edges shape:", edges.shape)

# 18. mean pooling (average pool 2x2)
def mean_pool(img_p, pool_size=2):
    h_p, w_p, c_p = img_p.shape
    h_out = h_p // pool_size
    w_out = w_p // pool_size
    out_p = img_p[:h_out*pool_size, :w_out*pool_size, :].reshape(
        h_out, pool_size, w_out, pool_size, c_p).mean(axis=(1, 3))
    return out_p
print("Ex18 mean pool shape:", mean_pool(img).shape)

# 19. max pooling
def max_pool(img_mp, pool_size=2):
    h_m, w_m, c_m = img_mp.shape
    h_o = h_m // pool_size
    w_o = w_m // pool_size
    return img_mp[:h_o*pool_size, :w_o*pool_size, :].reshape(
        h_o, pool_size, w_o, pool_size, c_m).max(axis=(1, 3))
print("Ex19 max pool shape:", max_pool(img).shape)

# 20. image normalization to [0, 1] float
img_f = img.astype(float) / 255.
print("Ex20 float img range:", img_f.min().round(3), img_f.max().round(3))

# 21. standardize image channels
img_std = (img_f - img_f.mean(axis=(0,1), keepdims=True)) / (img_f.std(axis=(0,1), keepdims=True) + 1e-8)
print("Ex21 standardized mean:", img_std.mean(axis=(0,1)).round(4))

# 22. channel-wise min-max normalization
ch_min = img_f.min(axis=(0,1), keepdims=True)
ch_max = img_f.max(axis=(0,1), keepdims=True)
img_ch_norm = (img_f - ch_min) / (ch_max - ch_min + 1e-8)
print("Ex22 channel norm max:", img_ch_norm.max(axis=(0,1)).round(4))

# 23. compute mean image from batch
batch = np.random.randint(0, 256, (5, 8, 10, 3), dtype=np.uint8)
mean_img = batch.mean(axis=0)
print("Ex23 mean image shape:", mean_img.shape)

# 24. image difference (temporal)
frame1 = np.random.randint(100, 200, (8, 10, 3), dtype=np.uint8)
frame2 = np.random.randint(100, 200, (8, 10, 3), dtype=np.uint8)
diff = np.abs(frame1.astype(int) - frame2.astype(int)).astype(np.uint8)
print("Ex24 diff max:", diff.max())

# 25. threshold binary mask
motion_mask = diff.mean(axis=2) > 20
print("Ex25 motion pixels:", np.sum(motion_mask))

# 26. Gaussian blur in each channel
def gaussian_blur(img_b, sigma=1., size=5):
    from numpy.lib.stride_tricks import sliding_window_view
    k_1d = np.exp(-np.arange(-(size//2), size//2+1)**2 / (2*sigma**2))
    k_1d /= k_1d.sum()
    k_2d = np.outer(k_1d, k_1d)
    h_b, w_b, c_b = img_b.shape
    out_b = np.zeros_like(img_b, dtype=float)
    pad = size // 2
    img_padded = np.pad(img_b, ((pad,pad),(pad,pad),(0,0)), mode='reflect')
    for ci in range(c_b):
        try:
            windows = sliding_window_view(img_padded[:,:,ci].astype(float), (size,size))
            out_b[:,:,ci] = np.einsum('ij,hwij->hw', k_2d, windows)
        except ImportError:
            out_b[:,:,ci] = img_b[:,:,ci].astype(float)
    return out_b.astype(np.uint8)
blurred = gaussian_blur(img)
print("Ex26 blurred shape:", blurred.shape)

# 27. extract image patches
def extract_patches(img_e, patch_size, stride):
    H_e, W_e, C_e = img_e.shape
    patches_list = []
    for i in range(0, H_e - patch_size + 1, stride):
        for j in range(0, W_e - patch_size + 1, stride):
            patches_list.append(img_e[i:i+patch_size, j:j+patch_size, :])
    return np.array(patches_list)
patches = extract_patches(img, 4, 2)
print("Ex27 patches shape:", patches.shape)

# 28. reconstruct from average-overlapping patches (concept)
print("Ex28 patch size:", patches[0].shape)

# 29. image masking
mask_circ = np.zeros((8, 10), dtype=bool)
yy, xx = np.mgrid[:8, :10]
mask_circ[(xx-5)**2 + (yy-4)**2 < 9] = True
masked_img = img.copy()
masked_img[~mask_circ] = 0
print("Ex29 masked pixels:", np.sum(~mask_circ))

# 30. color space conversion: RGB → BGR
bgr = img[:, :, ::-1]
print("Ex30 BGR first pixel:", bgr[0, 0])

# --- ADVANCED ---

# 31. color space: RGB to (simplified) HSV
def rgb_to_value(rgb_v):
    r, g, b = rgb_v[..., 0]/255., rgb_v[..., 1]/255., rgb_v[..., 2]/255.
    return np.maximum.reduce([r, g, b])
V = rgb_to_value(img)
print("Ex31 Value channel shape:", V.shape)

# 32. bilateral filter concept (edge-preserving)
# Simplified: spatial Gaussian weighted by intensity similarity
def naive_bilateral(img_bi, sigma_s=1., sigma_r=30.):
    h_bi, w_bi = img_bi.shape[:2]
    out_bi = img_bi.copy().astype(float)
    return out_bi  # placeholder — illustrates concept
bi = naive_bilateral(gray.astype(np.float32))
print("Ex32 bilateral shape:", bi.shape)

# 33. Canny edge detection (first step: gradient magnitude)
Kx_c = np.array([[-1,0,1],[-2,0,2],[-1,0,1]], dtype=float) / 4
Ky_c = Kx_c.T
gray_test = np.random.rand(8, 10)
pad_c = np.pad(gray_test, 1, mode='reflect')
Gx_c = np.array([[np.sum(pad_c[i:i+3,j:j+3]*Kx_c) for j in range(10)] for i in range(8)])
Gy_c = np.array([[np.sum(pad_c[i:i+3,j:j+3]*Ky_c) for j in range(10)] for i in range(8)])
grad_mag = np.sqrt(Gx_c**2 + Gy_c**2)
print("Ex33 gradient magnitude shape:", grad_mag.shape)

# 34. connected components labeling (concept with flood fill)
binary_img = np.array([[1,1,0,0,1],
                        [1,0,0,1,1],
                        [0,0,1,1,0]])
print("Ex34 binary img nonzero:", np.sum(binary_img))

# 35. image moments (centroid)
def centroid(binary_i):
    yy_i, xx_i = np.where(binary_i)
    return yy_i.mean(), xx_i.mean()
print("Ex35 centroid:", centroid(binary_img))

# 36. aspect ratio and bounding box
def bounding_box(binary_b):
    ys, xs = np.where(binary_b)
    return ys.min(), xs.min(), ys.max(), xs.max()
print("Ex36 bounding box:", bounding_box(binary_img))

# 37. image pyramid (Gaussian pyramid, one level)
def pyramid_down(img_pyr):
    return img_pyr[::2, ::2, :]
pyramid_l1 = pyramid_down(img)
pyramid_l2 = pyramid_down(pyramid_l1)
print("Ex37 pyramid L2 shape:", pyramid_l2.shape)

# 38. optical flow concept (block matching)
def sad(block1, block2):
    return np.sum(np.abs(block1.astype(int) - block2.astype(int)))
patch_a = img[2:5, 3:6, 0]
patch_b = img[2:5, 4:7, 0]
print("Ex38 SAD:", sad(patch_a, patch_b))

# 39. image quality: PSNR
def psnr(original_q, compressed_q, max_val=255.):
    mse = np.mean((original_q.astype(float) - compressed_q.astype(float))**2)
    if mse == 0:
        return float('inf')
    return 20 * np.log10(max_val / np.sqrt(mse))
noise_img = np.clip(img.astype(int) + np.random.randint(-10, 10, img.shape), 0, 255).astype(np.uint8)
print("Ex39 PSNR:", psnr(img, noise_img).round(2))

# 40. SSIM concept (simplified luminance component)
def luminance(x, y, C1=6.5025):
    mu_x, mu_y = x.mean(), y.mean()
    return (2*mu_x*mu_y + C1) / (mu_x**2 + mu_y**2 + C1)
g1_ssim = gray.astype(float)
g2_ssim = (gray + np.random.randn(*gray.shape) * 5).clip(0, 255)
print("Ex40 luminance component:", luminance(g1_ssim, g2_ssim).round(4))

# 41. template matching (sum of squared differences)
template = img[2:5, 3:6, :].astype(float)
H_tm, W_tm = img.shape[0] - template.shape[0] + 1, img.shape[1] - template.shape[1] + 1
ssd = np.array([[np.sum((img[i:i+3, j:j+3, :].astype(float) - template)**2)
                 for j in range(W_tm)] for i in range(H_tm)])
best_r, best_c = np.unravel_index(np.argmin(ssd), ssd.shape)
print("Ex41 template match at:", best_r, best_c)

# 42. color quantization (k-means concept — mean of clusters)
pixels = img.reshape(-1, 3).astype(float)
# simple 2-cluster split on mean
split = pixels.mean(axis=0)
cluster0 = pixels[pixels[:, 0] < split[0]]
cluster1 = pixels[pixels[:, 0] >= split[0]]
print("Ex42 cluster sizes:", len(cluster0), len(cluster1))

# --- EXPERT ---

# 43. DCT (Discrete Cosine Transform) basis
N_dct = 8
def dct_matrix(N_d):
    i_d = np.arange(N_d)
    j_d = np.arange(N_d)
    D = np.cos(np.pi * i_d[:, None] * (2*j_d[None,:]+1) / (2*N_d))
    D[0, :] /= np.sqrt(N_d)
    D[1:, :] *= np.sqrt(2./N_d)
    return D
D_mat = dct_matrix(N_dct)
print("Ex43 DCT matrix shape:", D_mat.shape)

# 44. JPEG-like quantization
block_8x8 = gray[:8, :8]
Q_table = np.array([[16,11,10,16,24,40,51,61],
                    [12,12,14,19,26,58,60,55],
                    [14,13,16,24,40,57,69,56],
                    [14,17,22,29,51,87,80,62],
                    [18,22,37,56,68,109,103,77],
                    [24,35,55,64,81,104,113,92],
                    [49,64,78,87,103,121,120,101],
                    [72,92,95,98,112,100,103,99]])
dct_block = D_mat @ (block_8x8 - 128) @ D_mat.T
quantized = np.round(dct_block / Q_table)
print("Ex44 quantized block zeros:", np.sum(quantized == 0))

# 45. inverse DCT reconstruction
dequantized = quantized * Q_table
recon_block = D_mat.T @ dequantized @ D_mat + 128
print("Ex45 recon error:", np.abs(block_8x8 - np.clip(recon_block, 0, 255)).mean().round(2))

# 46. image gradient magnitude and direction
def gradient_and_direction(img_gd):
    Kx_g = np.array([[-1,0,1]], dtype=float)
    Ky_g = Kx_g.T
    def conv1d(I, K):
        return np.array([[np.sum(I[max(0,i-1):i+2, max(0,j-1):j+2] * np.broadcast_to(K, (3,1) if K.shape==(3,1) else (1,3))[:I[max(0,i-1):i+2].shape[0], :])
                          for j in range(I.shape[1])] for i in range(I.shape[0])])
    Gx = np.diff(img_gd, axis=1, prepend=img_gd[:,:1])
    Gy = np.diff(img_gd, axis=0, prepend=img_gd[:1,:])
    return np.sqrt(Gx**2 + Gy**2), np.arctan2(Gy, Gx)
mag46, angle46 = gradient_and_direction(gray)
print("Ex46 gradient shape:", mag46.shape)

# 47. non-maximum suppression concept (Canny step 2)
# suppress pixels that are not local maxima in gradient direction
print("Ex47 NMS concept: angle range", angle46.min().round(2), angle46.max().round(2))

# 48. Watershed segmentation seed concept
seeds = np.zeros((8, 10), dtype=int)
seeds[1, 2] = 1  # seed for region 1
seeds[6, 8] = 2  # seed for region 2
print("Ex48 seed locations:", np.argwhere(seeds > 0).tolist())

# 49. batch image processing with broadcasting
batch_imgs = np.random.randint(0, 256, (10, 8, 10, 3), dtype=np.uint8)
# normalize batch
batch_mean = batch_imgs.mean(axis=(0, 1, 2), keepdims=True)
batch_std = batch_imgs.std(axis=(0, 1, 2), keepdims=True)
batch_normed = (batch_imgs.astype(float) - batch_mean) / (batch_std + 1e-8)
print("Ex49 batch normalized shape:", batch_normed.shape)

# 50. image registration (translation) using FFT cross-correlation
img1_r = gray.astype(float)
shift_r = (1, 2)
img2_r = np.roll(np.roll(img1_r, shift_r[0], axis=0), shift_r[1], axis=1)
cross_corr = np.fft.ifft2(np.fft.fft2(img1_r) * np.conj(np.fft.fft2(img2_r)))
peak = np.unravel_index(np.argmax(np.abs(cross_corr)), cross_corr.shape)
print("Ex50 detected shift:", peak)


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
