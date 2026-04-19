# ============================================================================
# Solution 1.1 — Arrays and Dtypes
# ============================================================================
# Learn to create NumPy arrays with specific data types, convert between
# dtypes, and inspect array metadata like shape, dtype, itemsize, and nbytes.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Creating arrays with specific dtypes
# ---------------------------------------------------------------------------

# Create a 1D array of integers 0–9 with dtype int32
arr_int32 = np.arange(10, dtype=np.int32)

# Create a 1D array of 5 zeros with dtype float64
arr_zeros = np.zeros(5, dtype=np.float64)

# Create a 1D array of 5 ones with dtype bool
arr_ones_bool = np.ones(5, dtype=np.bool_)

# Create an array from the list [1, 2, 3] with dtype complex128
arr_complex = np.array([1, 2, 3], dtype=np.complex128)

# ---------------------------------------------------------------------------
# 2. Using np.arange and np.linspace
# ---------------------------------------------------------------------------

# Create an array from 0 to 20 (exclusive) step 2, dtype float32
arr_arange = np.arange(0, 20, 2, dtype=np.float32)

# Create 7 evenly spaced values from 0.0 to 1.0 inclusive (float64)
arr_linspace = np.linspace(0.0, 1.0, 7, dtype=np.float64)

# ---------------------------------------------------------------------------
# 3. dtype conversion with astype()
# ---------------------------------------------------------------------------

source = np.array([1.7, 2.3, 3.9, 4.1])

# Convert source to int32 (truncates decimals)
arr_as_int = source.astype(np.int32)

# Convert source to bool (nonzero → True)
arr_as_bool = source.astype(np.bool_)

# ---------------------------------------------------------------------------
# 4. Inspecting array metadata
# ---------------------------------------------------------------------------

base = np.zeros((3, 4), dtype=np.float64)

# Store the shape of base as a tuple
base_shape = base.shape

# Store the total number of bytes used by base
base_nbytes = base.nbytes

# Store the size in bytes of one element of base
base_itemsize = base.itemsize

# ---------------------------------------------------------------------------
# 5. Special constructors
# ---------------------------------------------------------------------------

# Create a 3x3 identity matrix with dtype float64
eye_matrix = np.eye(3, dtype=np.float64)

# Create a 2x3 array filled with the value 7 (int64)
full_arr = np.full((2, 3), 7, dtype=np.int64)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert arr_int32 is not None, "arr_int32 must be defined"
    assert arr_int32.dtype == np.int32, f"Expected int32, got {arr_int32.dtype}"
    assert list(arr_int32) == list(range(10)), "arr_int32 should be 0–9"

    assert arr_zeros is not None, "arr_zeros must be defined"
    assert arr_zeros.dtype == np.float64, f"Expected float64, got {arr_zeros.dtype}"
    assert arr_zeros.shape == (5,), "arr_zeros should have shape (5,)"
    assert np.all(arr_zeros == 0), "arr_zeros should be all zeros"

    assert arr_ones_bool is not None, "arr_ones_bool must be defined"
    assert arr_ones_bool.dtype == np.bool_, f"Expected bool, got {arr_ones_bool.dtype}"
    assert np.all(arr_ones_bool), "arr_ones_bool should be all True"

    assert arr_complex is not None, "arr_complex must be defined"
    assert arr_complex.dtype == np.complex128, f"Expected complex128, got {arr_complex.dtype}"

    assert arr_arange is not None, "arr_arange must be defined"
    assert arr_arange.dtype == np.float32, f"Expected float32, got {arr_arange.dtype}"
    assert len(arr_arange) == 10, "arr_arange should have 10 elements"

    assert arr_linspace is not None, "arr_linspace must be defined"
    assert len(arr_linspace) == 7, "arr_linspace should have 7 elements"
    assert np.isclose(arr_linspace[0], 0.0), "first element should be 0.0"
    assert np.isclose(arr_linspace[-1], 1.0), "last element should be 1.0"

    assert arr_as_int is not None, "arr_as_int must be defined"
    assert arr_as_int.dtype == np.int32, f"Expected int32, got {arr_as_int.dtype}"
    assert list(arr_as_int) == [1, 2, 3, 4], "truncation should give [1,2,3,4]"

    assert arr_as_bool is not None, "arr_as_bool must be defined"
    assert arr_as_bool.dtype == np.bool_, "arr_as_bool should be bool"
    assert np.all(arr_as_bool), "all nonzero floats → True"

    assert base_shape == (3, 4), f"Expected (3,4), got {base_shape}"
    assert base_nbytes == 3 * 4 * 8, f"float64 uses 8 bytes each"
    assert base_itemsize == 8, "float64 itemsize is 8"

    assert eye_matrix is not None, "eye_matrix must be defined"
    assert eye_matrix.shape == (3, 3), "eye_matrix should be 3x3"
    assert np.allclose(eye_matrix, np.eye(3)), "eye_matrix should be identity"

    assert full_arr is not None, "full_arr must be defined"
    assert full_arr.shape == (2, 3), "full_arr should have shape (2,3)"
    assert np.all(full_arr == 7), "full_arr should be filled with 7"

    print("Solution 1.1 — All assertions passed!")

if __name__ == "__main__":
    main()
