# ============================================================================
# Exercise 3.1 — Strides and Views
# ============================================================================
# Understand the .strides attribute, memory sharing between views and
# originals, np.shares_memory, np.ascontiguousarray, and using
# np.lib.stride_tricks.as_strided for efficient sliding window operations.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np
from numpy.lib.stride_tricks import as_strided

# ---------------------------------------------------------------------------
# 1. Understanding strides
# ---------------------------------------------------------------------------

arr_c = np.array([[1, 2, 3, 4],
                  [5, 6, 7, 8]], dtype=np.int32)   # C-order (row-major)

# TODO: store the strides of arr_c
strides_c = None  # replace None
# For int32 in C-order: strides should be (16, 4) — bytes

# TODO: create the same data in Fortran order and store its strides
arr_f = None  # replace None  — use np.asfortranarray(arr_c)
strides_f = None  # replace None

# ---------------------------------------------------------------------------
# 2. Views vs copies and shared memory
# ---------------------------------------------------------------------------

base = np.arange(12, dtype=np.float64)

# TODO: create a view by reshaping base to (3, 4) — should share memory
view_2d = None  # replace None

# TODO: create a copy by calling .copy() on the reshaped array
copy_2d = None  # replace None

# ---------------------------------------------------------------------------
# 3. Checking contiguity
# ---------------------------------------------------------------------------

mat = np.arange(12, dtype=np.float64).reshape(3, 4)

# TODO: check if mat is C-contiguous (True/False)
is_c_contiguous = None  # replace None

# TODO: transpose mat — the result is NOT C-contiguous
mat_T = None  # replace None

# TODO: check if mat_T is C-contiguous
is_T_c_contiguous = None  # replace None

# TODO: use np.ascontiguousarray to make mat_T contiguous, store result
mat_T_contig = None  # replace None

# ---------------------------------------------------------------------------
# 4. Sliding window view using as_strided
# ---------------------------------------------------------------------------

signal = np.array([1., 2., 3., 4., 5., 6., 7., 8.], dtype=np.float64)
window_size = 3
n_windows = len(signal) - window_size + 1  # 6 windows

# TODO: use as_strided to create a (6, 3) view of overlapping windows
#       Each row should be a window of size 3
#       Hint: shape=(n_windows, window_size), strides=(signal.strides[0], signal.strides[0])
windows = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert strides_c is not None, "strides_c must be defined"
    assert strides_c == (16, 4), \
        f"int32 C-order 4 cols: row stride=16 bytes, col stride=4 bytes. Got {strides_c}"

    assert arr_f is not None, "arr_f must be defined"
    assert strides_f is not None, "strides_f must be defined"
    assert strides_f == (4, 8), \
        f"int32 F-order 2 rows: row stride=4 bytes, col stride=8 bytes. Got {strides_f}"

    assert view_2d is not None, "view_2d must be defined"
    assert view_2d.shape == (3, 4), "view_2d should be (3,4)"
    assert np.shares_memory(view_2d, base), "view_2d should share memory with base"

    assert copy_2d is not None, "copy_2d must be defined"
    assert copy_2d.shape == (3, 4), "copy_2d should be (3,4)"
    assert not np.shares_memory(copy_2d, base), "copy_2d should NOT share memory"

    assert is_c_contiguous is True, "mat should be C-contiguous"

    assert mat_T is not None, "mat_T must be defined"
    assert mat_T.shape == (4, 3), "mat_T should be (4,3)"

    assert is_T_c_contiguous is False, "transposed matrix is not C-contiguous"

    assert mat_T_contig is not None, "mat_T_contig must be defined"
    assert mat_T_contig.flags['C_CONTIGUOUS'], "mat_T_contig should be C-contiguous"
    assert np.allclose(mat_T_contig, mat_T), "mat_T_contig values should match mat_T"

    assert windows is not None, "windows must be defined"
    assert windows.shape == (6, 3), f"Expected (6,3), got {windows.shape}"
    assert np.allclose(windows[0], [1., 2., 3.]), f"first window wrong: {windows[0]}"
    assert np.allclose(windows[-1], [6., 7., 8.]), f"last window wrong: {windows[-1]}"

    print("Exercise 3.1 — All assertions passed!")

if __name__ == "__main__":
    main()
