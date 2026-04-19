# ============================================================================
# Exercise 6.1 — Memory Mapping
# ============================================================================
# Use np.memmap for out-of-core array processing: create, read, write,
# process in chunks, and compute statistics without loading all data.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np
import tempfile
import os

np.random.seed(42)

tmpdir = tempfile.mkdtemp()
def tmpfile(name): return os.path.join(tmpdir, name)

# ---------------------------------------------------------------------------
# 1. Create a writable 1D memmap of float64, shape (500,)
# ---------------------------------------------------------------------------

# TODO: create a writable ('w+') memmap at tmpfile('ex.dat'), dtype float64, shape (500,)
mm = None  # replace None

# ---------------------------------------------------------------------------
# 2. Write data to the memmap
# ---------------------------------------------------------------------------

# TODO: fill mm with np.arange(500, dtype=np.float64) and call mm.flush()
# (write directly to mm[:] = ...)

# ---------------------------------------------------------------------------
# 3. Re-open as read-only and verify
# ---------------------------------------------------------------------------

# TODO: open the same file as read-only ('r'), same dtype and shape
mm_ro = None  # replace None

# ---------------------------------------------------------------------------
# 4. 2D memmap — create and fill
# ---------------------------------------------------------------------------

# TODO: create a writable memmap at tmpfile('data2d.dat'), dtype float32,
#       shape (200, 50), fill it with random float32 values
mm2d = None  # replace None
# mm2d[:] = ...

# ---------------------------------------------------------------------------
# 5. Compute column means of mm2d in chunks of 20 rows
#    without calling mm2d.mean(axis=0) directly on the full array
# ---------------------------------------------------------------------------

# TODO: iterate over mm2d in chunks of 20 rows, accumulate the sum and
#       divide by the number of rows. Result: col_means_chunked, shape (50,)
col_means_chunked = None  # replace None

# ---------------------------------------------------------------------------
# 6. Find the global maximum without loading all at once (chunked)
# ---------------------------------------------------------------------------

# TODO: iterate over mm2d in chunks of 20 rows,
#       track the running maximum. Result: chunked_max (scalar)
chunked_max = None  # replace None

# ---------------------------------------------------------------------------
# 7. Structured memmap
# ---------------------------------------------------------------------------

dt_struct = np.dtype([('id', 'i4'), ('value', 'f8')])

# TODO: create a writable structured memmap at tmpfile('struct.dat'),
#       shape (100,), fill 'id' with np.arange(100) and 'value' with
#       np.random.rand(100)
mm_struct = None  # replace None

# ---------------------------------------------------------------------------
# 8. Read a memmap at an offset (skip first 100 float64 elements)
# ---------------------------------------------------------------------------

# First create the source file
mm_src = np.memmap(tmpfile('src.dat'), dtype='float64', mode='w+', shape=(300,))
mm_src[:] = np.arange(300, dtype=np.float64)
mm_src.flush()
del mm_src

# TODO: open tmpfile('src.dat') as read-only, dtype float64, shape (200,),
#       offset = 100 * 8  (skip first 100 float64 elements)
mm_offset = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert mm is not None, "mm must be defined"
    assert isinstance(mm, np.memmap), "mm should be a np.memmap"
    assert mm.dtype == np.float64, f"mm dtype should be float64, got {mm.dtype}"
    assert mm.shape == (500,), f"mm shape should be (500,), got {mm.shape}"
    assert np.allclose(mm, np.arange(500, dtype=np.float64)), "mm values should be 0..499"

    assert mm_ro is not None, "mm_ro must be defined"
    assert isinstance(mm_ro, np.memmap), "mm_ro should be a np.memmap"
    assert mm_ro.flags.writeable == False, "mm_ro should be read-only"
    assert np.allclose(mm_ro, np.arange(500, dtype=np.float64)), "mm_ro values should match mm"

    assert mm2d is not None, "mm2d must be defined"
    assert isinstance(mm2d, np.memmap), "mm2d should be a np.memmap"
    assert mm2d.dtype == np.float32, f"mm2d dtype should be float32"
    assert mm2d.shape == (200, 50), f"mm2d shape should be (200, 50)"

    assert col_means_chunked is not None, "col_means_chunked must be defined"
    assert col_means_chunked.shape == (50,), f"col_means_chunked shape should be (50,)"
    assert np.allclose(col_means_chunked, np.array(mm2d).mean(axis=0), atol=1e-5), \
        "chunked column means should match direct column means"

    assert chunked_max is not None, "chunked_max must be defined"
    assert np.isclose(float(chunked_max), float(np.array(mm2d).max()), atol=1e-5), \
        f"chunked_max {chunked_max} should equal mm2d.max() {np.array(mm2d).max()}"

    assert mm_struct is not None, "mm_struct must be defined"
    assert isinstance(mm_struct, np.memmap), "mm_struct should be a np.memmap"
    assert mm_struct.dtype == dt_struct, "mm_struct dtype should match dt_struct"
    assert mm_struct.shape == (100,), "mm_struct shape should be (100,)"
    assert np.array_equal(mm_struct['id'], np.arange(100)), "mm_struct 'id' field mismatch"

    assert mm_offset is not None, "mm_offset must be defined"
    assert isinstance(mm_offset, np.memmap), "mm_offset should be a np.memmap"
    assert mm_offset.shape == (200,), "mm_offset shape should be (200,)"
    assert np.isclose(mm_offset[0], 100.), \
        f"mm_offset[0] should be 100.0 (first element after skipping 100), got {mm_offset[0]}"
    assert np.isclose(mm_offset[-1], 299.), \
        f"mm_offset[-1] should be 299.0, got {mm_offset[-1]}"

    print("Exercise 6.1 — All assertions passed!")

    # Cleanup
    pass  # cleanup handled outside main()

if __name__ == "__main__":
    main()
    import shutil
    shutil.rmtree(tmpdir, ignore_errors=True)
