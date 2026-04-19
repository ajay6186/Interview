# ============================================================================
# Examples 1.1 — Arrays and Dtypes  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. create 1D array from a list
arr = np.array([1, 2, 3, 4, 5])
print("Ex01:", arr)

# 2. create 1D array of zeros
zeros = np.zeros(5)
print("Ex02:", zeros)

# 3. create 1D array of ones
ones = np.ones(5)
print("Ex03:", ones)

# 4. create array with np.arange (like range)
arange = np.arange(10)
print("Ex04:", arange)

# 5. create array with np.arange and step
arange_step = np.arange(0, 20, 2)
print("Ex05:", arange_step)

# 6. create array with np.linspace
linspace = np.linspace(0, 1, 11)
print("Ex06:", linspace)

# 7. check dtype of an array
arr_float = np.array([1.0, 2.0, 3.0])
print("Ex07 dtype:", arr_float.dtype)

# 8. create array with explicit int32 dtype
arr_i32 = np.array([1, 2, 3], dtype=np.int32)
print("Ex08 dtype:", arr_i32.dtype)

# 9. create array with float32 dtype
arr_f32 = np.array([1.0, 2.0, 3.0], dtype=np.float32)
print("Ex09 dtype:", arr_f32.dtype)

# 10. create array with complex dtype
arr_c = np.array([1+2j, 3+4j], dtype=np.complex128)
print("Ex10:", arr_c)

# 11. create bool array
arr_bool = np.array([True, False, True], dtype=np.bool_)
print("Ex11:", arr_bool)

# 12. create 2D array of zeros
zeros_2d = np.zeros((3, 4))
print("Ex12 shape:", zeros_2d.shape)

# 13. create 2D array of ones with int dtype
ones_2d = np.ones((2, 3), dtype=np.int64)
print("Ex13:", ones_2d)

# 14. identity matrix
eye = np.eye(4)
print("Ex14 diagonal:", np.diag(eye))

# 15. np.full — fill array with constant value
full = np.full((3, 3), 9)
print("Ex15:", full)

# --- INTERMEDIATE ---

# 16. astype() — convert float to int (truncates)
arr_f = np.array([1.9, 2.5, 3.1])
arr_i = arr_f.astype(np.int32)
print("Ex16:", arr_i)  # [1, 2, 3]

# 17. astype() — convert int to float
arr_i2 = np.array([1, 2, 3], dtype=np.int32)
arr_f2 = arr_i2.astype(np.float64)
print("Ex17 dtype:", arr_f2.dtype)

# 18. astype() — convert to bool
arr_mixed = np.array([0, 1, -1, 0, 5])
arr_b = arr_mixed.astype(np.bool_)
print("Ex18:", arr_b)  # [F, T, T, F, T]

# 19. check itemsize (bytes per element)
a64 = np.zeros(1, dtype=np.float64)
a32 = np.zeros(1, dtype=np.float32)
print("Ex19 float64 itemsize:", a64.itemsize, "float32:", a32.itemsize)

# 20. check nbytes (total memory)
big = np.zeros((100, 100), dtype=np.float64)
print("Ex20 nbytes:", big.nbytes)  # 80000

# 21. dtype from string descriptor
arr_str_dtype = np.array([1, 2, 3], dtype='int16')
print("Ex21 dtype:", arr_str_dtype.dtype)

# 22. np.zeros_like — same shape and dtype as another array
source = np.array([[1, 2], [3, 4]], dtype=np.float32)
zl = np.zeros_like(source)
print("Ex22:", zl, "dtype:", zl.dtype)

# 23. np.ones_like
ol = np.ones_like(source)
print("Ex23:", ol)

# 24. np.full_like
fl = np.full_like(source, fill_value=3.14)
print("Ex24:", fl)

# 25. np.empty — uninitialized (fast but values are garbage)
empty = np.empty((2, 2), dtype=np.float64)
print("Ex25 shape:", empty.shape)

# 26. linspace with retstep to get step size
vals, step = np.linspace(0, 10, 5, retstep=True)
print("Ex26 step:", step)  # 2.5

# 27. arange with float step
arr_f_step = np.arange(0.0, 1.0, 0.1)
print("Ex27:", arr_f_step.round(1))

# 28. check ndim (number of dimensions)
arr3d = np.zeros((2, 3, 4))
print("Ex28 ndim:", arr3d.ndim)

# 29. check size (total number of elements)
arr2d = np.ones((4, 5))
print("Ex29 size:", arr2d.size)  # 20

# 30. view dtype reinterpretation (advanced cast)
raw = np.array([1, 2, 3, 4], dtype=np.uint8)
reinterp = raw.view(np.uint16)
print("Ex30 view dtype:", reinterp.dtype)

# --- ADVANCED ---

# 31. create structured-like array with object dtype
arr_obj = np.array(['hello', 'world', 'numpy'], dtype=object)
print("Ex31:", arr_obj)

# 32. unicode string dtype
arr_uni = np.array(['abc', 'defg', 'hi'], dtype='U10')
print("Ex32 dtype:", arr_uni.dtype)

# 33. bytes string dtype
arr_bytes = np.array([b'hello', b'world'], dtype='S10')
print("Ex33 dtype:", arr_bytes.dtype)

# 34. inf and nan as special float values
special = np.array([np.inf, -np.inf, np.nan])
print("Ex34:", special)

# 35. np.isinf and np.isnan
print("Ex35 isinf:", np.isinf(special), "isnan:", np.isnan(special))

# 36. integer overflow behavior
max_i8 = np.array(127, dtype=np.int8)
overflowed = max_i8 + np.int8(1)
print("Ex36 overflow:", overflowed)  # -128 (wraps)

# 37. upcast when mixing dtypes
mixed = np.array([1, 2.0])  # int + float → float64
print("Ex37 dtype:", mixed.dtype)

# 38. np.result_type — what dtype would result from mixing
rt = np.result_type(np.int32, np.float64)
print("Ex38 result_type:", rt)

# 39. np.can_cast — check safe casting
print("Ex39 can cast int32→float64:", np.can_cast(np.int32, np.float64))
print("Ex39 can cast float64→int32 safe:", np.can_cast(np.float64, np.int32, casting='safe'))

# 40. np.min_scalar_type — minimum dtype to hold a value
print("Ex40:", np.min_scalar_type(200))   # uint8
print("Ex40:", np.min_scalar_type(-100))  # int8
print("Ex40:", np.min_scalar_type(1000))  # int16

# 41. create array from bytes buffer
import array as pyarray
buf = pyarray.array('f', [1.0, 2.0, 3.0, 4.0])
np_from_buf = np.frombuffer(buf, dtype=np.float32)
print("Ex41:", np_from_buf)

# 42. dtype machine byte order
dt = np.dtype(np.float64)
print("Ex42 byteorder:", dt.byteorder)

# --- EXPERT ---

# 43. native vs big-endian dtype
dt_native = np.dtype('>f8')  # big-endian float64
arr_be = np.array([1.0, 2.0], dtype=dt_native)
print("Ex43 dtype:", arr_be.dtype)

# 44. byteswap to change endianness
swapped = arr_be.byteswap().newbyteorder()
print("Ex44 after swap dtype:", swapped.dtype)

# 45. dtype alignment with align parameter
dt_aligned = np.dtype([('x', np.float32), ('y', np.float64)], align=True)
print("Ex45 itemsize aligned:", dt_aligned.itemsize)

# 46. np.dtype.newbyteorder
dt_le = np.dtype('<f4')
print("Ex46:", dt_le)

# 47. count of each dtype category
types = [np.int8, np.int16, np.int32, np.int64,
         np.float32, np.float64, np.complex64, np.complex128]
for t in types:
    print(f"Ex47 {np.dtype(t).name}: itemsize={np.dtype(t).itemsize}")

# 48. fromfunction — build array using index function
def index_sum(i, j):
    return i + j
grid = np.fromfunction(index_sum, (4, 4), dtype=int)
print("Ex48:\n", grid)

# 49. np.frompyfunc for custom element-wise with dtype
add_str = np.frompyfunc(lambda x: str(x), 1, 1)
result = add_str(np.arange(5))
print("Ex49:", result, "dtype:", result.dtype)

# 50. dtype descriptor string round-trip
dt_orig = np.dtype([('name', 'U20'), ('age', 'i4'), ('score', 'f8')])
dt_str = dt_orig.str  # or use dt_orig.descr
print("Ex50 dtype from descriptor:", dt_orig.names)


def main():
    # Re-run all examples to confirm no errors
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
