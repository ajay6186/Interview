# ============================================================================
# Examples 2.5 — Structured Arrays  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

# --- BASIC ---

# 1. define a simple structured dtype
dt = np.dtype([('x', 'f4'), ('y', 'f4')])
print("Ex01 dtype:", dt)

# 2. create a structured array
pts = np.array([(1.0, 2.0), (3.0, 4.0), (5.0, 6.0)], dtype=dt)
print("Ex02:", pts)

# 3. access field by name
print("Ex03 x field:", pts['x'])

# 4. access field 'y'
print("Ex04 y field:", pts['y'])

# 5. access single record
print("Ex05 record 0:", pts[0])

# 6. access single field of a record
print("Ex06 pts[1]['y']:", pts[1]['y'])

# 7. dtype with string field
dt2 = np.dtype([('name', 'U10'), ('value', 'f8')])
arr2 = np.array([('alpha', 1.5), ('beta', 2.3)], dtype=dt2)
print("Ex07:", arr2)

# 8. structured dtype field names
print("Ex08 field names:", arr2.dtype.names)

# 9. structured dtype field types
print("Ex09 field dtype:", arr2.dtype['value'])

# 10. boolean mask on structured array
mask = arr2['value'] > 2.0
print("Ex10 filtered:", arr2[mask])

# 11. sort by field
dt3 = np.dtype([('name', 'U10'), ('age', 'i4')])
people = np.array([('Zara', 25), ('Anna', 30), ('Ben', 22)], dtype=dt3)
print("Ex11 sorted by age:", np.sort(people, order='age'))

# 12. sort by multiple fields (secondary sort)
dt4 = np.dtype([('dept', 'U5'), ('age', 'i4')])
emp2 = np.array([('IT', 30), ('HR', 25), ('IT', 22), ('HR', 35)], dtype=dt4)
print("Ex12 sorted dept then age:", np.sort(emp2, order=['dept', 'age']))

# 13. modify a field
pts_copy = pts.copy()
pts_copy['x'] = pts_copy['x'] * 2
print("Ex13 doubled x:", pts_copy['x'])

# 14. assign new values to a record
pts_copy[0] = (10.0, 20.0)
print("Ex14 updated record:", pts_copy[0])

# 15. compute on field values
print("Ex15 distance:", np.sqrt(pts['x']**2 + pts['y']**2))

# --- INTERMEDIATE ---

# 16. np.recarray — attribute-style access
rec = np.rec.array(pts)
print("Ex16 rec.x:", rec.x)
print("Ex16 rec.y:", rec.y)

# 17. np.rec.fromarrays
x_arr = np.array([1., 2., 3.])
y_arr = np.array([4., 5., 6.])
rec2 = np.rec.fromarrays([x_arr, y_arr], names=['x', 'y'])
print("Ex17 rec2.x:", rec2.x)

# 18. structured array from dict-like
dt5 = np.dtype([('score', 'f4'), ('grade', 'U2')])
grades = np.array([(90.5, 'A'), (75.0, 'C'), (82.3, 'B')], dtype=dt5)
print("Ex18:", grades)

# 19. view structured as void
void_view = grades.view(np.void)
print("Ex19 void type:", void_view.dtype)

# 20. stacking structured arrays with np.concatenate
part1 = np.array([('Alice', 30)], dtype=dt3)
part2 = np.array([('Bob', 25), ('Carol', 35)], dtype=dt3)
combined = np.concatenate([part1, part2])
print("Ex20:", combined)

# 21. np.lib.recfunctions.append_fields (adds a new field)
from numpy.lib import recfunctions as rfn
dt6 = np.dtype([('name', 'U10'), ('val', 'f4')])
arr6 = np.array([('a', 1.0), ('b', 2.0)], dtype=dt6)
new_field = np.array([10, 20])
arr_aug = rfn.append_fields(arr6, 'extra', new_field, dtypes='i4')
print("Ex21 new field:", arr_aug['extra'])

# 22. rfn.drop_fields
arr_drop = rfn.drop_fields(arr_aug, 'extra')
print("Ex22 dropped:", arr_drop.dtype.names)

# 23. rfn.rename_fields
arr_ren = rfn.rename_fields(arr6, {'val': 'value'})
print("Ex23 renamed:", arr_ren.dtype.names)

# 24. rfn.structured_to_unstructured
X_unstr = rfn.structured_to_unstructured(pts)
print("Ex24 unstructured:", X_unstr)

# 25. rfn.unstructured_to_structured
X_raw = np.array([[1., 2.], [3., 4.]])
X_struct = rfn.unstructured_to_structured(X_raw, dtype=dt)
print("Ex25 structured:", X_struct)

# 26. itemsize of structured dtype
dt7 = np.dtype([('a', 'i4'), ('b', 'f8'), ('c', 'U5')])
print("Ex26 itemsize:", np.dtype(dt7).itemsize)

# 27. np.zeros with structured dtype
z_struct = np.zeros(3, dtype=dt)
print("Ex27:", z_struct)

# 28. np.empty with structured dtype
e_struct = np.empty(3, dtype=dt)
print("Ex28 shape:", e_struct.shape)

# 29. structured array argmax on a field
grades_f = np.array([(90.5, 'A'), (75.0, 'C'), (82.3, 'B')], dtype=dt5)
best_idx = np.argmax(grades_f['score'])
print("Ex29 best student idx:", best_idx, "score:", grades_f['score'][best_idx])

# 30. groupby-like aggregation on structured array
dept_arr = np.array([
    ('IT', 70000.), ('HR', 55000.), ('IT', 80000.),
    ('HR', 60000.), ('IT', 75000.)
], dtype=[('dept', 'U5'), ('salary', 'f8')])
for dept in np.unique(dept_arr['dept']):
    mask = dept_arr['dept'] == dept
    print(f"Ex30 {dept} mean salary:", dept_arr['salary'][mask].mean())

# --- ADVANCED ---

# 31. structured array with sub-array field
dt8 = np.dtype([('coords', 'f4', (2,)), ('label', 'U5')])
arr8 = np.array([([1., 2.], 'pt1'), ([3., 4.], 'pt2')], dtype=dt8)
print("Ex31 coords:", arr8['coords'])

# 32. nested structured dtype
inner = np.dtype([('re', 'f4'), ('im', 'f4')])
outer_dt = np.dtype([('id', 'i4'), ('z', inner)])
arr_nested = np.array([(1, (2., 3.)), (2, (4., 5.))], dtype=outer_dt)
print("Ex32 nested re:", arr_nested['z']['re'])

# 33. aligned dtype
dt_align = np.dtype([('x', 'i1'), ('y', 'f8')], align=True)
print("Ex33 aligned itemsize:", dt_align.itemsize)
dt_noalign = np.dtype([('x', 'i1'), ('y', 'f8')])
print("Ex33 unaligned itemsize:", dt_noalign.itemsize)

# 34. byte order specification
dt_le = np.dtype([('val', '<f8')])   # little-endian
dt_be = np.dtype([('val', '>f8')])   # big-endian
print("Ex34 LE byteorder:", dt_le['val'].byteorder)
print("Ex34 BE byteorder:", dt_be['val'].byteorder)

# 35. convert structured to regular array via view
pts2 = np.array([(1., 2.), (3., 4.)], dtype=[('x', 'f8'), ('y', 'f8')])
mat_view = pts2.view('f8').reshape(-1, 2)
print("Ex35 as regular array:\n", mat_view)

# 36. masked structured array concept
import numpy.ma as ma
ma_arr = ma.array(pts2, mask=np.array([True, False], dtype=[('x', bool), ('y', bool)]))
print("Ex36 masked y:", ma_arr['y'])

# 37. join/merge via sorting
a_struct = np.array([(1, 'Alice'), (2, 'Bob')], dtype=[('id', 'i4'), ('name', 'U10')])
b_struct = np.array([(2, 90.), (1, 85.)], dtype=[('id', 'i4'), ('score', 'f4')])
# Sort both by id
a_s = a_struct[np.argsort(a_struct['id'])]
b_s = b_struct[np.argsort(b_struct['id'])]
print("Ex37 joined names:", a_s['name'], "scores:", b_s['score'])

# 38. structured array as lookup table
lut = np.array([(0, 'zero'), (1, 'one'), (2, 'two')],
               dtype=[('key', 'i4'), ('label', 'U10')])
query = np.array([2, 0, 1])
idx = np.searchsorted(lut['key'], query)
print("Ex38 labels:", lut['label'][idx])

# 39. dtype introspection
for name in dt7.names:
    field_dt = dt7.fields[name]
    print(f"Ex39 field '{name}': dtype={field_dt[0]}, offset={field_dt[1]}")

# 40. structured array copy vs view
original_s = np.array([('A', 1), ('B', 2)], dtype=[('c', 'U1'), ('n', 'i4')])
view_s = original_s[:]
copy_s = original_s.copy()
view_s['n'][0] = 99
print("Ex40 view modifies original:", original_s['n'][0])  # 99
copy_s['n'][0] = -1
print("Ex40 copy does not:", original_s['n'][0])  # still 99

# 41. np.unique on structured field
names_arr = np.array([('A', 1), ('B', 2), ('A', 3), ('C', 1)],
                     dtype=[('letter', 'U1'), ('count', 'i4')])
print("Ex41 unique letters:", np.unique(names_arr['letter']))

# 42. rfn.merge_arrays
arr_a = np.array([(1,), (2,)], dtype=[('id', 'i4')])
arr_b = np.array([(10.,), (20.,)], dtype=[('val', 'f4')])
merged = rfn.merge_arrays([arr_a, arr_b], flatten=True)
print("Ex42 merged:", merged)

# --- EXPERT ---

# 43. structured array with offsets (manual dtype)
dt_manual = np.dtype({'names': ['x', 'y'], 'formats': ['f4', 'f4'], 'offsets': [0, 8]})
print("Ex43 manual dtype itemsize:", dt_manual.itemsize)

# 44. Parsing CSV-like data into structured array
import io
csv_data = "Alice,30,70000\nBob,25,55000"
lines = csv_data.strip().split('\n')
records = [(l.split(',')[0], int(l.split(',')[1]), float(l.split(',')[2]))
           for l in lines]
dt_csv = np.dtype([('name', 'U20'), ('age', 'i4'), ('salary', 'f8')])
csv_arr = np.array(records, dtype=dt_csv)
print("Ex44:", csv_arr)

# 45. memory layout of structured array
arr45 = np.zeros(2, dtype=[('a', 'i4'), ('b', 'f8')])
print("Ex45 strides:", arr45.strides)

# 46. array of structs vs struct of arrays performance concept
n = 10000
aos = np.zeros(n, dtype=[('x', 'f4'), ('y', 'f4'), ('z', 'f4')])
soa_x = np.zeros(n, dtype='f4')
soa_y = np.zeros(n, dtype='f4')
soa_z = np.zeros(n, dtype='f4')
# SoA is typically faster for column-wise operations
print("Ex46 AoS shape:", aos.shape, "SoA x shape:", soa_x.shape)

# 47. rfn.stack_arrays
s1 = np.array([('A', 1)], dtype=[('letter', 'U1'), ('num', 'i4')])
s2 = np.array([('B', 2)], dtype=[('letter', 'U1'), ('num', 'i4')])
stacked_s = rfn.stack_arrays([s1, s2])
print("Ex47:", stacked_s)

# 48. using np.frombuffer with structured dtype
import struct
raw_bytes = struct.pack('if', 42, 3.14)  # int + float (4+4 bytes)
dt_buf = np.dtype([('id', '<i4'), ('val', '<f4')])
from_buf = np.frombuffer(raw_bytes, dtype=dt_buf)
print("Ex48:", from_buf)

# 49. structured array comparison
sa = np.array([('Alice', 30), ('Bob', 25)], dtype=[('name', 'U10'), ('age', 'i4')])
print("Ex49 age > 27:", sa[sa['age'] > 27])

# 50. compute per-group statistics efficiently
groups = np.array([0, 1, 0, 1, 0, 2, 2], dtype=int)
values50 = np.array([1., 2., 3., 4., 5., 6., 7.])
for g in np.unique(groups):
    print(f"Ex50 group {g} mean:", values50[groups == g].mean())


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
