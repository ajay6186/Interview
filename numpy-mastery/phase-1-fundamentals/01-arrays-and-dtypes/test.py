import numpy as np
# arr = np.array([1,2,3,4,5])
# print("Ex01:", arr)

# zeros = np.zeros(5)
# print("Ex02:", zeros)

# ones = np.ones(5)
# print("Ex03:", ones)

# arange = np.arange(10)
# print("Ex04:", arange)

# arange_step = np.arange(0, 20, 2)
# print("Ex05:", arange_step)

# linspace = np.linspace(0, 1, 11)
# print("Ex06:", linspace)

# arr_float = np.array([1.0, 2.0, 3.0])
# print("Ex07 dtype:", arr_float.dtype)

# arr_i32 = np.array([1, 2, 3], dtype = np.int32)
# print("Ex08 dtype:", arr_i32.dtype)

# arr_f32 = np.array([1.0, 2.0, 3.0], dtype=np.float32)
# print("Ex09 dtype:", arr_f32.dtype)

# 10. create array with complex dtype
# arr_c = np.array([1+2j, 3+4j], dtype=np.complex128)
# print("Ex10:", arr_c)

# arr_bool = np.array([True, False, True], dtype=np.bool_)
# print("Ex11:", arr_bool)

# zeros_2d = np.zeros((3,4))
# print("Ex12 shape: ", zeros_2d.shape)

# ones_2d = np.ones((2,3), dtype=np.int64)
# print("Ex13:", ones_2d)

# eye = np.eye(4)
# print(np.diag(eye))


# full = np.full((3,3), 9)
# print(full)

# arr_f = np.array([1.9, 2.5, 3.1])
# arr_i = arr_f.astype(np.int32)
# print("Ex16:", arr_i)

# arr_i2 = np.array([1, 2, 3], dtype=np.int32)
# arr_f2 = arr_i2.astype(np.float64)
# print("Ex17 dtype: ", arr_f2.dtype)

# 18. astype() - convert to bool
# arr_mixed = np.array([0, 1, -1, 0, 5])
# arr_b = arr_mixed.astype(np.bool_)
# print("Ex18:", arr_b)

# a64 = np.zeros(1, dtype = np.float64)
# a32 = np.zeros(1, dtype=np.float32)
# print("Ex19 float64 itemsize:", a64.itemsize, "float32:", a32.itemsize)

# big = np.zeros((100, 100), dtype=np.float64)
# print("Ex20 nbytes:", big.nbytes)

source = np.array([[1, 2], [3, 4]], dtype=np.float32)
zl = np.zeros_like(source)
print("Ex22:", zl, "dtype:", zl.dtype)

# 23. np.ones_like
ol = np.ones_like(source)
print("Ex23:", ol)

# 24. np.full_like
fl = np.full_like(source, fill_value=3.14)
print("Ex24:", fl)