# ============================================================================
# Solution 3.5 — Performance
# ============================================================================
# Learn how memory layout (C vs F order), in-place operations, and
# np.einsum affect performance and correctness.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Memory contiguity
# ---------------------------------------------------------------------------

mat = np.arange(12, dtype=np.float64).reshape(3, 4)

# Check if mat is C-contiguous (bool)
c_contig = mat.flags['C_CONTIGUOUS']

# Create a Fortran-order copy of mat
mat_f = np.asfortranarray(mat)

# Check if mat_f is Fortran-contiguous (bool)
f_contig = mat_f.flags['F_CONTIGUOUS']

# ---------------------------------------------------------------------------
# 2. In-place operations
# ---------------------------------------------------------------------------

arr = np.array([1., 2., 3., 4., 5.])
arr_id_before = id(arr)

# Double every element IN-PLACE using *=
arr *= 2

arr_id_after = id(arr)

# ---------------------------------------------------------------------------
# 3. np.einsum for matrix operations
# ---------------------------------------------------------------------------

A = np.array([[1., 2.], [3., 4.]])
B = np.array([[5., 6.], [7., 8.]])
v = np.array([1., 2.])

# Use np.einsum to compute matrix multiply A @ B
einsum_matmul = np.einsum('ij,jk->ik', A, B)

# Use np.einsum to compute matrix-vector product A @ v
einsum_matvec = np.einsum('ij,j->i', A, v)

# Use np.einsum to compute the trace of A
einsum_trace = np.einsum('ii->', A)

# Use np.einsum to compute the outer product of v with itself
einsum_outer = np.einsum('i,j->ij', v, v)

# ---------------------------------------------------------------------------
# 4. Batch einsum
# ---------------------------------------------------------------------------

# Batch of 4 matrices, each (3, 3)
batch = np.arange(4 * 3 * 3, dtype=float).reshape(4, 3, 3)
eye3 = np.eye(3)

# Use np.einsum to compute batch @ eye3 for all 4 matrices
batch_mul = np.einsum('bij,jk->bik', batch, eye3)

# ---------------------------------------------------------------------------
# 5. Avoiding copies with views
# ---------------------------------------------------------------------------

large = np.arange(1000000, dtype=np.float64)

# Create a view that selects every 100th element (no copy)
strided_view = large[::100]

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert c_contig is True, "mat should be C-contiguous"
    assert mat_f is not None, "mat_f must be defined"
    assert f_contig is True, "mat_f should be Fortran-contiguous"
    assert np.allclose(mat_f, mat), "mat_f values should match mat"

    assert np.allclose(arr, [2., 4., 6., 8., 10.]), f"in-place *= 2 wrong: {arr}"
    assert arr_id_before == arr_id_after, "in-place op should not create a new object"

    assert einsum_matmul is not None, "einsum_matmul must be defined"
    assert np.allclose(einsum_matmul, A @ B), "einsum_matmul should match A@B"

    assert einsum_matvec is not None, "einsum_matvec must be defined"
    assert np.allclose(einsum_matvec, A @ v), "einsum_matvec should match A@v"

    assert einsum_trace is not None, "einsum_trace must be defined"
    assert np.isclose(einsum_trace, np.trace(A)), f"einsum_trace should be {np.trace(A)}"

    assert einsum_outer is not None, "einsum_outer must be defined"
    assert einsum_outer.shape == (2, 2), "einsum_outer should be (2,2)"
    assert np.allclose(einsum_outer, np.outer(v, v)), "einsum_outer should match np.outer"

    assert batch_mul is not None, "batch_mul must be defined"
    assert batch_mul.shape == (4, 3, 3), f"batch_mul should be (4,3,3)"
    assert np.allclose(batch_mul, batch), "multiplying by identity should be no-op"

    assert strided_view is not None, "strided_view must be defined"
    assert np.shares_memory(strided_view, large), "strided_view should share memory"
    assert len(strided_view) == 10000, f"should have 10000 elements, got {len(strided_view)}"
    assert strided_view[0] == 0. and strided_view[1] == 100., "strided_view values wrong"

    print("Solution 3.5 — All assertions passed!")

if __name__ == "__main__":
    main()
