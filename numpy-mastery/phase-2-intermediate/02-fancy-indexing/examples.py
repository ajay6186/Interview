# ============================================================================
# Examples 2.2 — Fancy Indexing  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. boolean mask on 1D array
arr = np.array([10, 25, 3, 42, 7, 18])
print("Ex01:", arr[arr > 10])  # [25 42 18]

# 2. boolean mask with condition
print("Ex02:", arr[arr % 2 == 0])  # even numbers

# 3. integer array indexing
idx = np.array([0, 2, 4])
print("Ex03:", arr[idx])  # [10 3 7]

# 4. repeated indices
print("Ex04:", arr[np.array([0, 0, 1, 1])])

# 5. integer indexing on 2D
mat = np.arange(12).reshape(3, 4)
rows = np.array([0, 2])
cols = np.array([1, 3])
print("Ex05:", mat[rows, cols])  # [1, 11]

# 6. select full rows by integer index
print("Ex06:\n", mat[np.array([2, 0])])

# 7. np.where with condition and choices
x = np.array([-2, -1, 0, 1, 2])
print("Ex07:", np.where(x >= 0, x, 0))

# 8. np.where with two arrays
a = np.array([1, 2, 3, 4])
b = np.array([10, 20, 30, 40])
cond = a > 2
print("Ex08:", np.where(cond, a, b))  # [10 20 3 4]

# 9. np.nonzero — indices of nonzero elements
arr2 = np.array([0, 5, 0, 3, 0])
print("Ex09:", np.nonzero(arr2)[0])  # [1 3]

# 10. np.argmax — index of max
print("Ex10:", np.argmax(np.array([3, 1, 4, 1, 5, 9, 2])))  # 5

# 11. np.argmin — index of min
print("Ex11:", np.argmin(np.array([3, 1, 4, 1, 5, 9, 2])))  # 1

# 12. np.argsort — sort indices ascending
unsorted = np.array([3, 1, 4, 1, 5, 9])
print("Ex12:", np.argsort(unsorted))

# 13. use argsort to get sorted array
print("Ex13:", unsorted[np.argsort(unsorted)])

# 14. argsort descending
print("Ex14:", unsorted[np.argsort(unsorted)[::-1]])

# 15. np.sort vs argsort
print("Ex15 sort:", np.sort(unsorted))

# --- INTERMEDIATE ---

# 16. argmax/argmin along axis
mat2 = np.array([[3, 1, 4], [1, 5, 9], [2, 6, 5]])
print("Ex16 argmax axis=0:", np.argmax(mat2, axis=0))
print("Ex16 argmax axis=1:", np.argmax(mat2, axis=1))

# 17. boolean indexing on 2D (flattens)
print("Ex17:", mat2[mat2 > 4])

# 18. boolean mask assignment
arr3 = np.arange(10, dtype=float)
arr3[arr3 > 5] = 0
print("Ex18:", arr3)

# 19. fancy indexing assignment
arr4 = np.zeros(8)
arr4[np.array([1, 3, 5])] = 99
print("Ex19:", arr4)

# 20. np.take — gather by index
print("Ex20:", np.take(np.arange(10), [2, 5, 8]))

# 21. np.take along axis
m3 = np.arange(12).reshape(3, 4)
print("Ex21:", np.take(m3, [0, 2], axis=0))

# 22. np.put — scatter values into flat index
arr5 = np.zeros(8)
np.put(arr5, [1, 4, 6], [10, 20, 30])
print("Ex22:", arr5)

# 23. np.searchsorted — find insertion point
sorted_arr = np.array([1, 3, 5, 7, 9])
print("Ex23:", np.searchsorted(sorted_arr, 4))  # 2

# 24. np.searchsorted with array of values
print("Ex24:", np.searchsorted(sorted_arr, [2, 6, 10]))

# 25. np.flatnonzero — flat indices of nonzero
arr6 = np.array([[0, 1], [0, 3], [4, 0]])
print("Ex25:", np.flatnonzero(arr6))

# 26. np.unique — unique values and their counts
arr7 = np.array([1, 2, 2, 3, 3, 3, 4])
vals, counts = np.unique(arr7, return_counts=True)
print("Ex26:", vals, counts)

# 27. np.in1d — element membership test
print("Ex27:", np.isin(np.array([1, 2, 5, 6]), np.array([2, 4, 6])))

# 28. np.extract — like boolean indexing
condition = np.mod(np.arange(10), 3) == 0
print("Ex28:", np.extract(condition, np.arange(10)))

# 29. compound boolean mask with & and |
arr8 = np.arange(20)
mask = (arr8 % 2 == 0) & (arr8 > 10)
print("Ex29:", arr8[mask])

# 30. np.where to find outliers and replace
data = np.array([1., 2., 100., 3., -50., 4.])
clean = np.where(np.abs(data) > 10, np.nan, data)
print("Ex30:", clean)

# --- ADVANCED ---

# 31. argsort on 2D by specific column
records = np.array([[3, 'a'], [1, 'b'], [2, 'c']], dtype=object)
sorted_by_col0 = records[np.argsort(records[:, 0].astype(int))]
print("Ex31:", sorted_by_col0)

# 32. top-k values using argsort
arr9 = np.array([5, 2, 8, 1, 9, 3, 7])
k = 3
top_k_idx = np.argsort(arr9)[-k:][::-1]
print("Ex32 top-3 indices:", top_k_idx, "values:", arr9[top_k_idx])

# 33. np.partition — partial sort (faster than full sort for top-k)
arr10 = np.array([5, 2, 8, 1, 9, 3, 7])
print("Ex33 partition:", np.partition(arr10, -3)[-3:])

# 34. 2D boolean mask preserving rows
mat4 = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
row_mask = mat4.sum(axis=1) > 10
print("Ex34 rows with sum>10:\n", mat4[row_mask])

# 35. multi-condition replacement
arr11 = np.arange(-5, 6, dtype=float)
result = np.select(
    [arr11 < -2, arr11 > 2],
    [-1., 1.],
    default=0.
)
print("Ex35:", result)

# 36. np.choose — pick from multiple arrays
choice_idx = np.array([0, 1, 2, 0, 1])
choices = [np.array([10, 20, 30, 40, 50]),
           np.array([1, 2, 3, 4, 5]),
           np.array([100, 200, 300, 400, 500])]
print("Ex36:", np.choose(choice_idx, choices))

# 37. fancy indexing into structured output
mat5 = np.arange(25).reshape(5, 5)
row_ids = np.array([0, 2, 4])
col_ids = np.array([1, 3, 0])
print("Ex37:", mat5[row_ids, col_ids])

# 38. np.ix_ for cross-product selection
r = np.array([0, 2])
c = np.array([1, 3])
ri, ci = np.ix_(r, c)
print("Ex38:\n", mat5[ri, ci])

# 39. scatter-add (using np.add.at)
target = np.zeros(5)
indices_add = np.array([1, 2, 1, 3, 1])
np.add.at(target, indices_add, 1)
print("Ex39:", target)  # [0, 3, 1, 1, 0]

# 40. boolean indexing with np.mgrid
yy, xx = np.mgrid[:5, :5]
circle_mask = (xx - 2)**2 + (yy - 2)**2 <= 4
print("Ex40 circle pixels:", np.sum(circle_mask))

# 41. np.unravel_index for 2D argmax
flat_mat = np.array([[1, 9, 3], [4, 2, 8]])
flat_idx = np.argmax(flat_mat)
print("Ex41 2D argmax:", np.unravel_index(flat_idx, flat_mat.shape))

# 42. np.ravel_multi_index — reverse of unravel_index
multi_idx = (1, 2)
flat = np.ravel_multi_index(multi_idx, (3, 4))
print("Ex42 ravel_multi_index:", flat)

# --- EXPERT ---

# 43. advanced: sorted indices for stable sort
arr12 = np.array([3, 1, 4, 1, 5, 9, 2, 6, 5])
stable_idx = np.argsort(arr12, kind='stable')
print("Ex43 stable sort:", arr12[stable_idx])

# 44. lexsort — sort by multiple keys (last key is primary)
surnames = np.array([1, 2, 1, 2])
firstnames = np.array([2, 1, 1, 2])
lex_idx = np.lexsort((firstnames, surnames))
print("Ex44 lexsort:", lex_idx)

# 45. boolean mask to select and modify in-place
mat6 = np.arange(12, dtype=float).reshape(3, 4)
mat6[mat6 % 3 == 0] *= -1
print("Ex45:\n", mat6)

# 46. indexing with np.ogrid
y_og, x_og = np.ogrid[:4, :4]
print("Ex46 ogrid sum:\n", (x_og + y_og))

# 47. fancy indexing with broadcast shapes
A = np.arange(20).reshape(4, 5)
r2 = np.array([[0], [2]])  # (2, 1)
c2 = np.array([1, 3, 4])    # (3,)
print("Ex47:\n", A[r2, c2])  # (2, 3) result

# 48. np.isin with 2D array
mat7 = np.arange(9).reshape(3, 3)
print("Ex48:\n", np.isin(mat7, [1, 4, 7]))

# 49. filtering rows by column criterion
df_like = np.array([[1, 5, 3],
                    [4, 2, 9],
                    [7, 8, 1]])
# select rows where column 1 >= 5
print("Ex49:", df_like[df_like[:, 1] >= 5])

# 50. building index arrays programmatically
n = 6
upper_tri_idx = np.triu_indices(n, k=1)
mat8 = np.arange(n*n).reshape(n, n)
print("Ex50 upper tri elements count:", len(mat8[upper_tri_idx]))


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
