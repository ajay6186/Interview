# ============================================================================
# Solution 6.1 — Memory Mapping
# ============================================================================

import numpy as np
import tempfile
import os

np.random.seed(42)

tmpdir = tempfile.mkdtemp()
def tmpfile(name): return os.path.join(tmpdir, name)

# 1. Create writable memmap
mm = np.memmap(tmpfile('ex.dat'), dtype='float64', mode='w+', shape=(500,))

# 2. Write data
mm[:] = np.arange(500, dtype=np.float64)
mm.flush()

# 3. Read-only memmap
mm_ro = np.memmap(tmpfile('ex.dat'), dtype='float64', mode='r', shape=(500,))

# 4. 2D memmap
mm2d = np.memmap(tmpfile('data2d.dat'), dtype='float32', mode='w+', shape=(200, 50))
mm2d[:] = np.random.rand(200, 50).astype(np.float32)

# 5. Chunked column means
col_sums = np.zeros(50, dtype=np.float64)
for i in range(0, 200, 20):
    col_sums += np.array(mm2d[i:i+20], dtype=np.float64).sum(axis=0)
col_means_chunked = col_sums / 200

# 6. Chunked global max
chunked_max = -np.inf
for i in range(0, 200, 20):
    chunked_max = max(chunked_max, float(mm2d[i:i+20].max()))

# 7. Structured memmap
dt_struct = np.dtype([('id', 'i4'), ('value', 'f8')])
mm_struct = np.memmap(tmpfile('struct.dat'), dtype=dt_struct, mode='w+', shape=(100,))
mm_struct['id'] = np.arange(100, dtype=np.int32)
mm_struct['value'] = np.random.rand(100)

# 8. Memmap with offset
mm_src = np.memmap(tmpfile('src.dat'), dtype='float64', mode='w+', shape=(300,))
mm_src[:] = np.arange(300, dtype=np.float64)
mm_src.flush()
del mm_src
mm_offset = np.memmap(tmpfile('src.dat'), dtype='float64', mode='r',
                      shape=(200,), offset=100 * 8)

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert mm is not None
    assert isinstance(mm, np.memmap)
    assert mm.dtype == np.float64
    assert mm.shape == (500,)
    assert np.allclose(mm, np.arange(500, dtype=np.float64))

    assert mm_ro is not None
    assert isinstance(mm_ro, np.memmap)
    assert mm_ro.flags.writeable == False
    assert np.allclose(mm_ro, np.arange(500, dtype=np.float64))

    assert mm2d is not None
    assert isinstance(mm2d, np.memmap)
    assert mm2d.dtype == np.float32
    assert mm2d.shape == (200, 50)

    assert col_means_chunked is not None
    assert col_means_chunked.shape == (50,)
    assert np.allclose(col_means_chunked, np.array(mm2d).mean(axis=0), atol=1e-5)

    assert chunked_max is not None
    assert np.isclose(float(chunked_max), float(np.array(mm2d).max()), atol=1e-5)

    assert mm_struct is not None
    assert isinstance(mm_struct, np.memmap)
    assert mm_struct.dtype == dt_struct
    assert mm_struct.shape == (100,)
    assert np.array_equal(mm_struct['id'], np.arange(100))

    assert mm_offset is not None
    assert isinstance(mm_offset, np.memmap)
    assert mm_offset.shape == (200,)
    assert np.isclose(mm_offset[0], 100.)
    assert np.isclose(mm_offset[-1], 299.)

    print("Solution 6.1 — All assertions passed!")

if __name__ == "__main__":
    main()
    import shutil
    shutil.rmtree(tmpdir, ignore_errors=True)
