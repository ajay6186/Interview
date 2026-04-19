# ============================================================================
# Exercise 4.3 — Signal Processing
# ============================================================================
# Compute FFTs, find dominant frequencies, convolve signals with kernels,
# and interpolate using NumPy's FFT and convolution tools.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. FFT of a sine wave
# ---------------------------------------------------------------------------

# Create a 1 second signal at 100 Hz sample rate containing a 5 Hz sine wave
sample_rate = 100   # Hz
duration = 1.0      # seconds
t = np.linspace(0., duration, sample_rate, endpoint=False)
freq = 5.0          # Hz
signal = np.sin(2 * np.pi * freq * t)

# TODO: compute the FFT of signal
fft_result = None  # replace None

# TODO: compute the frequency bins using np.fft.fftfreq
freq_bins = None  # replace None

# TODO: compute the magnitude spectrum (absolute value of fft_result)
magnitude = None  # replace None

# ---------------------------------------------------------------------------
# 2. Find dominant frequency
# ---------------------------------------------------------------------------

# TODO: find the dominant positive frequency
#       Use freq_bins > 0 to select only positive frequencies
#       Then find the frequency bin with the highest magnitude
dominant_freq = None  # replace None (should be close to 5.0 Hz)

# ---------------------------------------------------------------------------
# 3. Inverse FFT (reconstruction)
# ---------------------------------------------------------------------------

# TODO: reconstruct the signal from fft_result using np.fft.ifft
reconstructed = None  # replace None

# ---------------------------------------------------------------------------
# 4. Convolution
# ---------------------------------------------------------------------------

signal2 = np.array([1., 0., -1., 0., 1., 0., -1., 0.])
kernel = np.array([0.25, 0.5, 0.25])  # smoothing kernel

# TODO: convolve signal2 with kernel using np.convolve with mode='same'
convolved = None  # replace None

# ---------------------------------------------------------------------------
# 5. Linear interpolation
# ---------------------------------------------------------------------------

x_sparse = np.array([0., 1., 3., 6., 10.])
y_sparse = np.array([0., 1., 2., 3., 4.])

# TODO: use np.interp to interpolate at x_new points
x_new = np.array([0.5, 2., 4., 8.])
y_interp = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert fft_result is not None, "fft_result must be defined"
    assert len(fft_result) == sample_rate, "FFT should have same length as signal"

    assert freq_bins is not None, "freq_bins must be defined"
    assert len(freq_bins) == sample_rate, "freq_bins should have same length as signal"

    assert magnitude is not None, "magnitude must be defined"
    assert magnitude.shape == fft_result.shape, "magnitude shape should match fft_result"

    assert dominant_freq is not None, "dominant_freq must be defined"
    assert np.isclose(dominant_freq, freq, atol=1.0), \
        f"dominant frequency should be ~{freq} Hz, got {dominant_freq}"

    assert reconstructed is not None, "reconstructed must be defined"
    assert np.allclose(reconstructed.real, signal, atol=1e-10), \
        "reconstructed signal should match original"

    assert convolved is not None, "convolved must be defined"
    assert convolved.shape == signal2.shape, "convolved should have same length as signal2"

    assert y_interp is not None, "y_interp must be defined"
    assert y_interp.shape == x_new.shape, "y_interp should match x_new shape"
    assert np.isclose(y_interp[0], 0.5, atol=0.01), \
        f"interpolated value at x=0.5 should be ~0.5, got {y_interp[0]}"
    assert np.isclose(y_interp[1], 1.5, atol=0.01), \
        f"interpolated value at x=2 should be ~1.5, got {y_interp[1]}"

    print("Exercise 4.3 — All assertions passed!")

if __name__ == "__main__":
    main()
