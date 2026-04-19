# ============================================================================
# Solution 1.2 — Array Indexing
# ============================================================================
# Master 1D/2D/3D indexing, slicing with start:stop:step, negative indices,
# multi-dimensional slicing, and understand the difference between views and
# copies.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. 1D indexing and slicing
# ---------------------------------------------------------------------------

arr1d = np.array([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])

# Get the first element
first = arr1d[0]

# Get the last element using a negative index
last = arr1d[-1]

# Get elements at index 2, 3, 4 (a slice)
middle_slice = arr1d[2:5]

# Get every other element (step=2)
every_other = arr1d[::2]

# Reverse the array using slicing
reversed_arr = arr1d[::-1]

# ---------------------------------------------------------------------------
# 2. 2D indexing
# ---------------------------------------------------------------------------

arr2d = np.array([[1,  2,  3,  4],
                  [5,  6,  7,  8],
                  [9, 10, 11, 12]])

# Get the element at row 1, column 2 (value = 7)
elem_1_2 = arr2d[1, 2]

# Get the entire second row (index 1) as a 1D array
row1 = arr2d[1, :]

# Get the entire third column (index 2) as a 1D array
col2 = arr2d[:, 2]

# Get the top-left 2x2 sub-matrix
submatrix = arr2d[:2, :2]

# Get the last two rows and last two columns
corner = arr2d[1:, 2:]

# ---------------------------------------------------------------------------
# 3. 3D indexing
# ---------------------------------------------------------------------------

arr3d = np.arange(24).reshape(2, 3, 4)

# Get the element at position [1, 2, 3]
elem_3d = arr3d[1, 2, 3]

# Get the second "sheet" (first axis index 1) — shape should be (3,4)
sheet1 = arr3d[1, :, :]

# ---------------------------------------------------------------------------
# 4. Views vs copies
# ---------------------------------------------------------------------------

original = np.array([1, 2, 3, 4, 5])

# Create a VIEW of elements index 1–3
view_slice = original[1:4]

# Create a COPY of elements index 1–3
copy_slice = original[1:4].copy()

# Modify the view — this SHOULD change original
# (Do not change this line)
if view_slice is not None:
    view_slice[0] = 99

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert first == 10, f"Expected 10, got {first}"
    assert last == 100, f"Expected 100, got {last}"
    assert list(middle_slice) == [30, 40, 50], f"Got {middle_slice}"
    assert list(every_other) == [10, 30, 50, 70, 90], f"Got {every_other}"
    assert list(reversed_arr) == [100, 90, 80, 70, 60, 50, 40, 30, 20, 10], f"Got {reversed_arr}"

    assert elem_1_2 == 7, f"Expected 7, got {elem_1_2}"
    assert list(row1) == [5, 6, 7, 8], f"Expected [5,6,7,8], got {row1}"
    assert list(col2) == [3, 7, 11], f"Expected [3,7,11], got {col2}"
    assert submatrix.shape == (2, 2), f"Expected (2,2), got {submatrix.shape}"
    assert submatrix[0, 0] == 1 and submatrix[1, 1] == 6, "submatrix values wrong"
    assert corner.shape == (2, 2), f"Expected (2,2), got {corner.shape}"
    assert corner[0, 0] == 7 and corner[1, 1] == 12, "corner values wrong"

    assert elem_3d == 23, f"Expected 23, got {elem_3d}"
    assert sheet1.shape == (3, 4), f"Expected (3,4), got {sheet1.shape}"
    assert sheet1[0, 0] == 12, f"Expected 12 at [0,0], got {sheet1[0, 0]}"

    # view_slice modifying original
    assert original[1] == 99, "view_slice should share memory with original"

    # copy_slice should be independent
    if copy_slice is not None:
        copy_slice[0] = -1
        assert original[1] == 99, "copy_slice should not affect original after its mod"

    assert not np.shares_memory(copy_slice, original), "copy_slice should not share memory"
    assert np.shares_memory(view_slice, original), "view_slice should share memory"

    print("Solution 1.2 — All assertions passed!")

if __name__ == "__main__":
    main()
