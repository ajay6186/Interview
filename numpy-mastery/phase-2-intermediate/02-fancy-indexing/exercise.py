# ============================================================================
# Exercise 2.2 — Fancy Indexing
# ============================================================================
# Learn boolean masking, integer array indexing, np.where, np.nonzero,
# np.argmax, np.argmin, and np.argsort.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Boolean masking
# ---------------------------------------------------------------------------

scores = np.array([45, 82, 67, 91, 55, 73, 88, 30, 95, 60])

# TODO: create a boolean mask for scores >= 70
mask_pass = None  # replace None

# TODO: use the mask to extract only passing scores
passing_scores = None  # replace None

# TODO: count the number of passing scores (use mask, not a loop)
pass_count = None  # replace None

# ---------------------------------------------------------------------------
# 2. Integer array indexing
# ---------------------------------------------------------------------------

data = np.array([100, 200, 300, 400, 500, 600])

# TODO: select elements at indices [0, 2, 4] using an index array
selected = None  # replace None

# TODO: select in reverse order: indices [5, 4, 3, 2, 1, 0]
reversed_data = None  # replace None

# ---------------------------------------------------------------------------
# 3. np.where
# ---------------------------------------------------------------------------

values = np.array([-3, -1, 0, 2, 5, -2, 4])

# TODO: use np.where to replace negatives with 0, keep positives unchanged
clipped = None  # replace None

# TODO: use np.where to label: 1 where values > 0, -1 where < 0, 0 where == 0
labels = None  # replace None

# ---------------------------------------------------------------------------
# 4. np.nonzero, np.argmax, np.argmin
# ---------------------------------------------------------------------------

arr = np.array([0, 3, 0, 7, 0, 2, 0, 9, 1])

# TODO: get the indices of nonzero elements (returns tuple — take [0])
nonzero_idx = None  # replace None

# TODO: get the index of the maximum element
argmax_idx = None  # replace None

# TODO: get the index of the minimum nonzero element (hint: use mask)
argmin_val = None  # replace None  # the VALUE at the minimum position (not index)

# ---------------------------------------------------------------------------
# 5. np.argsort
# ---------------------------------------------------------------------------

unsorted = np.array([42, 7, 23, 1, 99, 15])

# TODO: get the indices that would sort unsorted in ascending order
sort_idx = None  # replace None

# TODO: use sort_idx to get the sorted array
sorted_arr = None  # replace None

# TODO: get indices that sort in descending order
sort_idx_desc = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert mask_pass is not None and mask_pass.dtype == np.bool_, "mask_pass should be bool"
    assert list(mask_pass) == [False, True, False, True, False, True, True, False, True, False]

    assert passing_scores is not None, "passing_scores must be defined"
    assert np.allclose(passing_scores, [82, 91, 73, 88, 95]), f"passing_scores wrong: {passing_scores}"

    assert pass_count == 5, f"Expected 5, got {pass_count}"

    assert selected is not None, "selected must be defined"
    assert np.allclose(selected, [100, 300, 500]), f"selected wrong: {selected}"

    assert reversed_data is not None, "reversed_data must be defined"
    assert np.allclose(reversed_data, [600, 500, 400, 300, 200, 100]), f"reversed_data wrong"

    assert clipped is not None, "clipped must be defined"
    assert np.allclose(clipped, [0, 0, 0, 2, 5, 0, 4]), f"clipped wrong: {clipped}"

    assert labels is not None, "labels must be defined"
    assert np.allclose(labels, [-1, -1, 0, 1, 1, -1, 1]), f"labels wrong: {labels}"

    assert nonzero_idx is not None, "nonzero_idx must be defined"
    assert np.allclose(nonzero_idx, [1, 3, 5, 7, 8]), f"nonzero_idx wrong: {nonzero_idx}"

    assert argmax_idx == 7, f"argmax should be 7, got {argmax_idx}"

    assert argmin_val == 1, f"min nonzero val should be 1, got {argmin_val}"

    assert sort_idx is not None, "sort_idx must be defined"
    assert np.allclose(sort_idx, [3, 1, 5, 2, 0, 4]), f"sort_idx wrong: {sort_idx}"

    assert sorted_arr is not None, "sorted_arr must be defined"
    assert np.allclose(sorted_arr, [1, 7, 15, 23, 42, 99]), f"sorted_arr wrong: {sorted_arr}"

    assert sort_idx_desc is not None, "sort_idx_desc must be defined"
    assert np.allclose(unsorted[sort_idx_desc], [99, 42, 23, 15, 7, 1]), "descending sort wrong"

    print("Exercise 2.2 — All assertions passed!")

if __name__ == "__main__":
    main()
