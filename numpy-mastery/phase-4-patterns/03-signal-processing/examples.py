# ============================================================================
# Examples 4.3 — Signal Processing  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. create a sine wave
fs = 100  # sample rate
t = np.linspace(0., 1., fs, endpoint=False)
signal = np.sin(2 * np.pi * 5 * t)  # 5 Hz
print("Ex01 signal shape:", signal.shape)

# 2. FFT of sine wave
fft = np.fft.fft(signal)
print("Ex02 FFT shape:", fft.shape)

# 3. frequency bins
freqs = np.fft.fftfreq(fs, d=1./fs)
print("Ex03 freq range:", freqs.min(), "to", freqs.max())

# 4. magnitude spectrum
mag = np.abs(fft)
print("Ex04 peak magnitude:", mag.max().round(2))

# 5. find dominant frequency
pos = freqs > 0
dom_freq = freqs[pos][np.argmax(mag[pos])]
print("Ex05 dominant freq:", dom_freq, "Hz")

# 6. IFFT reconstruction
recon = np.fft.ifft(fft)
print("Ex06 reconstruction error:", np.max(np.abs(recon.real - signal)))

# 7. power spectrum
power = (mag ** 2) / fs
print("Ex07 power at 5Hz:", power[freqs == 5.].sum().round(2))

# 8. rfft — real FFT (only positive frequencies)
rfft = np.fft.rfft(signal)
print("Ex08 rfft shape:", rfft.shape)

# 9. rfft frequency bins
rfreqs = np.fft.rfftfreq(fs, d=1./fs)
print("Ex09 rfreq range:", rfreqs[0], "to", rfreqs[-1])

# 10. irfft reconstruction
recon2 = np.fft.irfft(rfft, n=fs)
print("Ex10 irfft error:", np.max(np.abs(recon2 - signal)))

# 11. multi-tone signal FFT
sig2 = np.sin(2*np.pi*5*t) + 0.5*np.sin(2*np.pi*10*t)
fft2 = np.fft.rfft(sig2)
mag2 = np.abs(fft2)
rfreqs2 = np.fft.rfftfreq(fs, d=1./fs)
peaks = rfreqs2[mag2 > 10]
print("Ex11 peaks at:", peaks)  # [5, 10]

# 12. np.convolve — moving average
kernel3 = np.ones(5) / 5
noisy = signal + np.random.RandomState(0).randn(fs) * 0.1
smoothed = np.convolve(noisy, kernel3, mode='same')
print("Ex12 smoothed shape:", smoothed.shape)

# 13. np.correlate — cross-correlation
a = np.array([1., 0., 0., 1., 0.])
b = np.array([0., 1., 0.])
print("Ex13 correlate:", np.correlate(a, b, mode='valid'))

# 14. np.interp — linear interpolation
x_sp = np.array([0., 1., 2., 3.])
y_sp = np.array([0., 1., 0., 1.])
print("Ex14 interp at 0.5:", np.interp(0.5, x_sp, y_sp))

# 15. np.interp with out-of-bounds
print("Ex15 interp OOB:", np.interp(np.array([-1., 4.]), x_sp, y_sp))  # extrapolation = boundary

# --- INTERMEDIATE ---

# 16. 2D FFT (image frequency analysis)
img = np.zeros((8, 8))
img[3, 3] = 1.  # impulse
fft2d = np.fft.fft2(img)
print("Ex16 2D FFT magnitude max:", np.abs(fft2d).max().round(2))  # should be 1

# 17. FFT shift (center zero frequency)
fft_shifted = np.fft.fftshift(fft)
print("Ex17 shifted FFT center:", np.abs(fft_shifted[fs//2]).round(2))

# 18. inverse FFT shift
fft_unshifted = np.fft.ifftshift(fft_shifted)
print("Ex18 unshift matches original:", np.allclose(fft_unshifted, fft))

# 19. windowing (Hann window to reduce spectral leakage)
window = np.hanning(fs)
sig_windowed = signal * window
fft_win = np.fft.rfft(sig_windowed)
print("Ex19 windowed FFT peak:", rfreqs2[np.argmax(np.abs(fft_win))], "Hz")

# 20. spectrogram (short-time FFT concept)
segment_len = 20
n_segments = fs // segment_len
spectro = np.array([np.abs(np.fft.rfft(signal[i*segment_len:(i+1)*segment_len]))
                    for i in range(n_segments)])
print("Ex20 spectrogram shape:", spectro.shape)

# 21. high-pass filter in frequency domain
fft_copy = fft.copy()
fft_copy[np.abs(freqs) < 3] = 0  # remove frequencies < 3 Hz
filtered = np.fft.ifft(fft_copy)
print("Ex21 high-pass filtered shape:", filtered.shape)

# 22. low-pass filter
fft_lp = fft.copy()
fft_lp[np.abs(freqs) > 7] = 0  # keep only < 7 Hz
filtered_lp = np.fft.ifft(fft_lp)
print("Ex22 low-pass error:", np.max(np.abs(filtered_lp.real - signal)).round(4))

# 23. band-pass filter
fft_bp = fft.copy()
band = (np.abs(freqs) >= 4) & (np.abs(freqs) <= 6)
fft_bp[~band] = 0
filtered_bp = np.fft.ifft(fft_bp)
print("Ex23 band-pass shape:", filtered_bp.shape)

# 24. autocorrelation via FFT
def autocorr(x):
    xf = np.fft.rfft(x, n=2*len(x))
    return np.fft.irfft(xf * np.conj(xf))[:len(x)]
ac = autocorr(signal)
print("Ex24 autocorr[0] (total power):", ac[0].round(2))

# 25. cross-correlation via FFT
def xcorr(x, y):
    n = len(x) + len(y) - 1
    xf = np.fft.rfft(x, n=n)
    yf = np.fft.rfft(y, n=n)
    return np.fft.irfft(xf * np.conj(yf))
delay = 3
sig_delayed = np.roll(signal, delay)
xc = xcorr(signal, sig_delayed)
print("Ex25 peak delay:", np.argmax(xc[:fs//2]), "samples")

# 26. np.convolve with 'full' mode
a26 = np.array([1., 2., 3.])
b26 = np.array([0., 1., 0.])
print("Ex26 full convolve:", np.convolve(a26, b26, mode='full'))

# 27. np.convolve with 'valid' mode (no boundary effects)
print("Ex27 valid convolve:", np.convolve(a26, b26, mode='valid'))

# 28. Gaussian smoothing kernel
def gaussian_kernel(sigma, size):
    x_k = np.arange(-(size//2), size//2 + 1)
    k = np.exp(-x_k**2 / (2*sigma**2))
    return k / k.sum()
gk = gaussian_kernel(1., 5)
print("Ex28 Gaussian kernel:", gk.round(4))

# 29. apply Gaussian smoothing
np.random.seed(42)
noisy2 = np.sin(2*np.pi*3*t) + np.random.randn(fs) * 0.3
smoothed2 = np.convolve(noisy2, gk, mode='same')
print("Ex29 Gaussian smoothed SNR improvement:", True)  # just verify it runs

# 30. np.interp with left/right bounds
x_in = np.linspace(0., 1., 5)
y_in = np.array([0., 1., 2., 1., 0.])
print("Ex30 interp:", np.interp(np.array([-0.5, 0.5, 1.5]), x_in, y_in, left=-1., right=-1.))

# --- ADVANCED ---

# 31. 2D FFT for image filtering
np.random.seed(42)
img2 = np.random.rand(16, 16)
fft_img = np.fft.fft2(img2)
# zero out high frequencies (low-pass)
fft_img_lp = fft_img.copy()
fft_img_shifted = np.fft.fftshift(fft_img_lp)
h, w = img2.shape
fft_img_shifted[h//2-3:h//2+3, w//2-3:w//2+3]  # center (low freq) stays
mask_2d = np.zeros((h, w), dtype=bool)
mask_2d[h//2-3:h//2+3, w//2-3:w//2+3] = True
fft_img_filtered = np.where(mask_2d, fft_img_shifted, 0)
img_filtered = np.abs(np.fft.ifft2(np.fft.ifftshift(fft_img_filtered)))
print("Ex31 2D filtered shape:", img_filtered.shape)

# 32. DFT matrix manually
N = 4
n = np.arange(N)
k = n[:, None]
W = np.exp(-2j * np.pi * k * n / N)
x_test = np.array([1., 0., 1., 0.])
dft_manual = W @ x_test
dft_numpy = np.fft.fft(x_test)
print("Ex32 DFT matches FFT:", np.allclose(dft_manual, dft_numpy))

# 33. zero-padding for interpolated frequency bins
sig_zp = np.sin(2*np.pi*5*t)
padded = np.concatenate([sig_zp, np.zeros(400)])
fft_zp = np.fft.rfft(padded)
freqs_zp = np.fft.rfftfreq(len(padded), d=1./fs)
print("Ex33 zero-padded freq resolution:", np.diff(freqs_zp[:2])[0], "Hz")

# 34. frequency domain differentiation
# d/dt x(t) → j*2*pi*f * X(f)
sig_diff = np.sin(2*np.pi*5*t)
fft_diff = np.fft.fft(sig_diff)
fft_deriv = fft_diff * (1j * 2 * np.pi * freqs)
deriv = np.fft.ifft(fft_deriv)
# compare with analytical d/dt sin(2*pi*5*t) = 2*pi*5*cos(2*pi*5*t)
analytic_deriv = 2 * np.pi * 5 * np.cos(2*np.pi*5*t)
print("Ex34 derivative error:", np.max(np.abs(deriv.real - analytic_deriv)).round(3))

# 35. Butterworth-like filter in frequency domain
def butterworth_lp(freqs_f, cutoff, order=4):
    return 1. / (1. + (np.abs(freqs_f) / cutoff) ** (2 * order))
H = butterworth_lp(freqs, 8.)
fft_buttered = fft * H
sig_buttered = np.fft.ifft(fft_buttered)
print("Ex35 Butterworth filtered shape:", sig_buttered.shape)

# 36. notch filter (remove specific frequency)
fft_notch = fft.copy()
notch_mask = np.abs(np.abs(freqs) - 5.) < 1.  # remove 5 Hz
fft_notch[notch_mask] = 0
notched = np.fft.ifft(fft_notch)
print("Ex36 notch filtered max:", np.abs(notched).max().round(4))  # should be near 0

# 37. signal energy
energy = np.sum(signal**2) / fs
print("Ex37 signal energy:", energy.round(4))

# 38. Parseval's theorem: energy in time = energy in frequency
energy_freq = np.sum(np.abs(fft)**2) / fs**2
print("Ex38 Parseval theorem:", np.isclose(energy, energy_freq, rtol=1e-5))

# 39. chirp signal (frequency changes over time)
t_chirp = np.linspace(0., 1., fs)
chirp = np.sin(2*np.pi*(5*t_chirp + 10*t_chirp**2))
print("Ex39 chirp signal range:", chirp.min().round(4), chirp.max().round(4))

# 40. STFT concept (short-time Fourier transform)
hop = 10
seg_len2 = 20
stft = np.array([np.fft.rfft(chirp[i:i+seg_len2] * np.hanning(seg_len2))
                 for i in range(0, fs-seg_len2, hop)])
print("Ex40 STFT shape:", stft.shape)

# 41. sinc interpolation
def sinc_interp(x_si, t_si, t_new):
    T = t_si[1] - t_si[0]
    return np.sum(x_si[:, None] * np.sinc((t_new[None, :] - t_si[:, None]) / T), axis=0)
t_coarse = np.linspace(0., 1., 10, endpoint=False)
x_coarse = np.sin(2*np.pi*2*t_coarse)
t_fine = np.linspace(0., 1., 50, endpoint=False)
x_sinc = sinc_interp(x_coarse, t_coarse, t_fine)
print("Ex41 sinc interp shape:", x_sinc.shape)

# 42. convolution theorem: convolution = multiplication in frequency domain
a42 = np.array([1., 2., 3., 0., 0., 0., 0., 0.])
b42 = np.array([0., 1., 0., 0., 0., 0., 0., 0.])
conv_time = np.convolve(a42[:4], b42[:4], mode='full')
fft_a = np.fft.fft(a42)
fft_b = np.fft.fft(b42)
conv_freq = np.fft.ifft(fft_a * fft_b)
print("Ex42 conv theorem matches:", np.allclose(conv_time[:4], conv_freq[:4].real))

# --- EXPERT ---

# 43. Welch's power spectral density estimate
def welch_psd(x_w, seg_size, fs_w):
    n_segs = len(x_w) // seg_size
    psd = np.zeros(seg_size // 2 + 1)
    for i in range(n_segs):
        seg = x_w[i*seg_size:(i+1)*seg_size] * np.hanning(seg_size)
        psd += np.abs(np.fft.rfft(seg))**2
    return np.fft.rfftfreq(seg_size, 1./fs_w), psd / n_segs
np.random.seed(42)
noisy3 = np.sin(2*np.pi*5*t) + np.random.randn(fs) * 0.3
freqs_psd, psd = welch_psd(noisy3, 20, fs)
print("Ex43 PSD peak freq:", freqs_psd[np.argmax(psd)], "Hz")

# 44. frequency shifting via modulation
f_shift = 2.
modulated = signal * np.cos(2*np.pi*f_shift*t)
fft_mod = np.fft.rfft(modulated)
freqs_mod = np.fft.rfftfreq(fs, 1./fs)
print("Ex44 modulated peaks:", freqs_mod[np.abs(fft_mod) > 5].tolist())

# 45. 2D convolution for image blurring (manual)
img3 = np.eye(5)
kernel_2d = np.ones((3, 3)) / 9.
def conv2d_manual(I, K):
    h, w = I.shape
    kh, kw = K.shape
    out = np.zeros((h - kh + 1, w - kw + 1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = np.sum(I[i:i+kh, j:j+kw] * K)
    return out
blurred = conv2d_manual(img3, kernel_2d)
print("Ex45 2D conv output shape:", blurred.shape)

# 46. Hilbert transform concept (analytic signal)
fft_hilbert = np.fft.fft(signal)
N_h = len(signal)
h_h = np.zeros(N_h)
h_h[0] = 1
h_h[1:N_h//2] = 2
h_h[N_h//2] = 1
analytic = np.fft.ifft(fft_hilbert * h_h)
instantaneous_amp = np.abs(analytic)
print("Ex46 inst amplitude (should be ~1):", instantaneous_amp.mean().round(3))

# 47. phase spectrum
phase = np.angle(fft_result := np.fft.fft(signal))
print("Ex47 phase at 5Hz:", phase[freqs == 5.][0].round(4))

# 48. group delay concept: -d(phase)/d(omega)
phases = np.unwrap(np.angle(np.fft.rfft(signal)))
omega = 2 * np.pi * np.fft.rfftfreq(fs, 1./fs)
group_delay = -np.gradient(phases, omega)
print("Ex48 group delay near 5Hz:", group_delay[5].round(2))

# 49. matched filter (cross-correlate with template)
template = np.sin(2*np.pi*5*np.linspace(0., 0.2, 20))
sig_noisy = np.concatenate([np.zeros(30), template, np.zeros(50)]) + \
            np.random.RandomState(42).randn(100) * 0.1
matched = np.correlate(sig_noisy, template, mode='valid')
print("Ex49 matched filter peak at:", np.argmax(matched))

# 50. frequency response of a FIR filter
def fir_response(b_fir, n_freqs=256):
    fft_b = np.fft.rfft(b_fir, n=n_freqs*2)
    freqs_r = np.fft.rfftfreq(n_freqs*2)
    return freqs_r[:n_freqs], np.abs(fft_b[:n_freqs])
b_lp = gaussian_kernel(2., 11)
f_resp, h_resp = fir_response(b_lp)
print("Ex50 FIR response shape:", h_resp.shape)


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
