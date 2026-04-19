# ============================================================================
# Exercise 2.4 — Random and Statistics
# ============================================================================
# Practice using NumPy's random module with reproducible seeds, compute
# percentiles and medians, build correlation matrices, and create histograms.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Seeded random arrays
# ---------------------------------------------------------------------------

np.random.seed(42)

# TODO: generate a 1D array of 100 uniform random floats in [0, 1)
uniform_arr = None  # replace None

# TODO: generate a 1D array of 100 standard normal random floats
normal_arr = None  # replace None

# TODO: generate a 1D array of 50 random integers in [1, 101)
int_arr = None  # replace None

# ---------------------------------------------------------------------------
# 2. Sampling with np.random.choice
# ---------------------------------------------------------------------------

population = np.arange(1, 51)  # 1 through 50

np.random.seed(42)
# TODO: sample 10 elements WITHOUT replacement from population
sample_no_replace = None  # replace None

np.random.seed(42)
# TODO: sample 10 elements WITH replacement from population
sample_replace = None  # replace None

# ---------------------------------------------------------------------------
# 3. Percentiles and median
# ---------------------------------------------------------------------------

np.random.seed(0)
data = np.random.normal(loc=100, scale=15, size=500)

# TODO: compute the 25th, 50th, and 75th percentiles of data
p25 = None  # replace None
p50 = None  # replace None
p75 = None  # replace None

# TODO: compute the median of data
median_val = None  # replace None

# TODO: compute the IQR (interquartile range) = p75 - p25
iqr = None  # replace None

# ---------------------------------------------------------------------------
# 4. Correlation matrix
# ---------------------------------------------------------------------------

np.random.seed(42)
X = np.random.randn(100, 3)  # 100 samples, 3 features

# TODO: compute the correlation matrix of X (shape should be (3, 3))
corr_matrix = None  # replace None

# ---------------------------------------------------------------------------
# 5. Histogram
# ---------------------------------------------------------------------------

np.random.seed(42)
samples = np.random.randn(1000)

# TODO: compute a histogram of samples with 20 bins
#       Store the counts in hist_counts and bin edges in hist_edges
hist_counts = None  # replace None
hist_edges = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert uniform_arr is not None, "uniform_arr must be defined"
    assert uniform_arr.shape == (100,), "uniform_arr should have 100 elements"
    assert 0.0 <= uniform_arr.min() < 1.0, "uniform_arr should be in [0,1)"
    assert 0.0 <= uniform_arr.max() < 1.0, "uniform_arr should be in [0,1)"

    assert normal_arr is not None, "normal_arr must be defined"
    assert normal_arr.shape == (100,), "normal_arr should have 100 elements"

    assert int_arr is not None, "int_arr must be defined"
    assert int_arr.shape == (50,), "int_arr should have 50 elements"
    assert int_arr.min() >= 1 and int_arr.max() <= 100, "int_arr should be in [1,100]"

    assert sample_no_replace is not None, "sample_no_replace must be defined"
    assert len(sample_no_replace) == 10, "sample_no_replace should have 10 elements"
    assert len(np.unique(sample_no_replace)) == 10, "no duplicates in no-replace sample"

    assert sample_replace is not None, "sample_replace must be defined"
    assert len(sample_replace) == 10, "sample_replace should have 10 elements"

    assert p25 is not None, "p25 must be defined"
    assert p50 is not None, "p50 must be defined"
    assert p75 is not None, "p75 must be defined"
    assert p25 < p50 < p75, "percentiles should be ordered"

    assert median_val is not None, "median_val must be defined"
    assert np.isclose(median_val, p50), "median should equal 50th percentile"

    assert iqr is not None, "iqr must be defined"
    assert np.isclose(iqr, p75 - p25), "IQR should be p75 - p25"
    assert iqr > 0, "IQR should be positive"

    assert corr_matrix is not None, "corr_matrix must be defined"
    assert corr_matrix.shape == (3, 3), f"corr_matrix should be (3,3), got {corr_matrix.shape}"
    assert np.allclose(np.diag(corr_matrix), 1.0), "diagonal of correlation matrix should be 1"

    assert hist_counts is not None, "hist_counts must be defined"
    assert hist_edges is not None, "hist_edges must be defined"
    assert len(hist_counts) == 20, "hist_counts should have 20 bins"
    assert len(hist_edges) == 21, "hist_edges should have 21 edges"
    assert np.sum(hist_counts) == 1000, "histogram counts should sum to 1000"

    print("Exercise 2.4 — All assertions passed!")

if __name__ == "__main__":
    main()
