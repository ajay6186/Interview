import numpy as np


# 1. create 1D array from a list
arr = np.array([1,2,3,4,5])
print("Ex01:", arr)

# 2. create 1D array of zeros
zeros = np.zeros(5)
print("Ex02:", zeros)

# 3. create 1D array of ones
ones = np.ones(5)
print("Ex03:",ones)

# 4. create array with np.arange (like range)
arange = np.arange(10)
print("Ex04:", arange)

# 5. create array with np.range and step
arange_step = np.arange(0, 20, 2)
print("Ex05:", arange_step)

# 6. create array with np.linspace
linespace = np.linspace(0, 1, 11)
print("Ex06:", linespace)

# 7. check dtype of an array
arr_float = np.array([1.0, 2.0, 3.0])
print("Ex08 dtype:", arr_float.dtype)

#8. create array with explicit int32 dtype
arr_i32 = np.array([1,2,3], dtype=np.int32)
print("Ex08 dtype:", arr_i32.dtype)