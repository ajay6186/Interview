# ============================================================================
# Examples 6.2 — Custom Dtypes  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import numpy as np

np.random.seed(42)

# --- BASIC ---

# 1. define a simple structured dtype
dt1 = np.dtype([('name', 'U20'), ('age', 'i4'), ('score', 'f8')])
print("Ex01 dtype:", dt1)
print("Ex01 itemsize:", dt1.itemsize)

# 2. create a structured array
students = np.array([
    ('Alice', 25, 92.5),
    ('Bob', 22, 87.3),
    ('Carol', 28, 95.1),
], dtype=dt1)
print("Ex02 students:", students)

# 3. access a named field
print("Ex03 names:", students['name'])

# 4. access multiple records
print("Ex04 first student:", students[0])

# 5. filter by field value
passed = students[students['score'] > 90]
print("Ex05 passed:", passed['name'])

# 6. sort by field
by_score = np.sort(students, order='score')
print("Ex06 sorted by score:", by_score['name'])

# 7. dtype from list of tuples
dt2 = np.dtype([('x', np.float32), ('y', np.float32)])
points = np.array([(1., 2.), (3., 4.), (5., 6.)], dtype=dt2)
print("Ex07 points x:", points['x'])

# 8. dtype with sub-array
dt3 = np.dtype([('label', 'i4'), ('features', 'f8', (3,))])
records = np.zeros(4, dtype=dt3)
records['features'] = np.random.rand(4, 3)
print("Ex08 features shape:", records['features'].shape)

# 9. compound dtype with padding (align=True)
dt_aligned = np.dtype([('a', 'i1'), ('b', 'f8')], align=True)
print("Ex09 aligned itemsize:", dt_aligned.itemsize)

# 10. dtype from a dict descriptor
dt_dict = np.dtype({'names': ['x', 'y', 'z'], 'formats': ['f4', 'f4', 'f4']})
print("Ex10 dict dtype:", dt_dict)

# 11. record array (np.recarray)
rec = np.rec.array([(1, 2.5), (3, 4.5)], dtype=[('i', 'i4'), ('f', 'f8')])
print("Ex11 rec.i:", rec.i, "rec.f:", rec.f)

# 12. view as structured array
raw_bytes = np.arange(12, dtype=np.float32)
struct_view = raw_bytes.view(np.dtype([('a', 'f4'), ('b', 'f4'), ('c', 'f4'), ('d', 'f4')]))
print("Ex12 struct view shape:", struct_view.shape)

# 13. byte order in dtype
dt_be = np.dtype('>f4')  # big-endian float32
dt_le = np.dtype('<f4')  # little-endian float32
arr_be = np.array([1., 2., 3.], dtype=dt_be)
print("Ex13 big-endian dtype:", arr_be.dtype)

# 14. void dtype (raw bytes)
dt_void = np.dtype('V4')  # 4-byte void
arr_void = np.zeros(5, dtype=dt_void)
print("Ex14 void dtype itemsize:", dt_void.itemsize)

# 15. np.dtype.names — list field names
print("Ex15 field names:", dt1.names)

# --- INTERMEDIATE ---

# 16. nested structured dtype
dt_nested = np.dtype([
    ('position', [('lat', 'f8'), ('lon', 'f8')]),
    ('altitude', 'f4'),
    ('timestamp', 'i8'),
])
waypoints = np.zeros(5, dtype=dt_nested)
waypoints['position']['lat'] = np.random.uniform(40, 50, 5)
waypoints['position']['lon'] = np.random.uniform(-10, 10, 5)
waypoints['altitude'] = np.random.uniform(0, 1000, 5).astype(np.float32)
print("Ex16 lat values:", waypoints['position']['lat'].round(4))

# 17. add a field to structured array (copy approach)
dt_ext = np.dtype(dt1.descr + [('grade', 'U1')])
students_ext = np.empty(len(students), dtype=dt_ext)
for field in dt1.names:
    students_ext[field] = students[field]
students_ext['grade'] = np.where(students['score'] >= 90, 'A', 'B')
print("Ex17 grades:", students_ext['grade'])

# 18. structured array to dict of arrays
def struct_to_dict(arr):
    return {name: arr[name] for name in arr.dtype.names}
d_students = struct_to_dict(students)
print("Ex18 dict keys:", list(d_students.keys()))

# 19. dict of arrays to structured array
def dict_to_struct(d_dict):
    dtype_list = [(k, v.dtype) for k, v in d_dict.items()]
    out = np.empty(len(next(iter(d_dict.values()))), dtype=dtype_list)
    for k, v in d_dict.items():
        out[k] = v
    return out
back = dict_to_struct({'x': np.array([1., 2., 3.]), 'y': np.array([4., 5., 6.])})
print("Ex19 reconstructed dtype:", back.dtype)

# 20. structured array comparison and masking
high_score = students[students['score'] >= np.mean(students['score'])]
print("Ex20 above average:", high_score['name'])

# 21. group-by operation on structured array
ages = np.array([20, 22, 20, 22, 20], dtype='i4')
data_group = np.array(list(zip(ages, np.random.rand(5))),
                      dtype=[('age', 'i4'), ('value', 'f8')])
for age_val in np.unique(ages):
    group_mean = data_group[data_group['age'] == age_val]['value'].mean()
    print(f"Ex21 age={age_val} mean value: {group_mean:.4f}")

# 22. structured array join (inner join by key)
dt_a = np.dtype([('id', 'i4'), ('val_a', 'f8')])
dt_b = np.dtype([('id', 'i4'), ('val_b', 'f8')])
arr_a = np.array([(1, 1.1), (2, 2.2), (3, 3.3)], dtype=dt_a)
arr_b = np.array([(1, 10.), (3, 30.), (4, 40.)], dtype=dt_b)
common_ids = np.intersect1d(arr_a['id'], arr_b['id'])
mask_a = np.isin(arr_a['id'], common_ids)
mask_b = np.isin(arr_b['id'], common_ids)
print("Ex22 inner join ids:", common_ids)

# 23. stacking structured arrays (vstack equivalent)
more_students = np.array([('Dave', 24, 78.9), ('Eve', 26, 91.0)], dtype=dt1)
all_students = np.concatenate([students, more_students])
print("Ex23 stacked length:", len(all_students))

# 24. structured array with datetime64
dt_ts = np.dtype([('timestamp', 'datetime64[s]'), ('value', 'f8')])
n_ts = 5
ts_arr = np.empty(n_ts, dtype=dt_ts)
ts_arr['timestamp'] = np.array(['2024-01-01', '2024-01-02', '2024-01-03',
                                  '2024-01-04', '2024-01-05'], dtype='datetime64[s]')
ts_arr['value'] = np.random.rand(n_ts)
print("Ex24 timestamps:", ts_arr['timestamp'])

# 25. compute distance between 2D points using structured array
n_points = 100
pts = np.zeros(n_points, dtype=[('x', 'f8'), ('y', 'f8')])
pts['x'] = np.random.rand(n_points)
pts['y'] = np.random.rand(n_points)
dists = np.sqrt((pts['x'] - 0.5)**2 + (pts['y'] - 0.5)**2)
closest = np.argmin(dists)
print("Ex25 closest to center:", closest, "dist:", round(dists[closest], 4))

# 26. structured array from CSV-like data (using np.loadtxt concept)
raw_data_str = np.array([('A', 1.0, 10), ('B', 2.5, 20), ('C', 3.7, 30)])
dt_csv = np.dtype([('name', 'U5'), ('value', 'f8'), ('count', 'i4')])
from_str = np.array([('A', 1.0, 10), ('B', 2.5, 20), ('C', 3.7, 30)], dtype=dt_csv)
print("Ex26 from CSV-like:", from_str)

# 27. structured array argsort by multiple fields
multi = np.array([('B', 2), ('A', 2), ('A', 1)],
                 dtype=[('letter', 'U1'), ('number', 'i4')])
order_multi = np.argsort(multi, order=['letter', 'number'])
print("Ex27 multi-field sort:", multi[order_multi])

# 28. dtype metadata / description
dt_meta = np.dtype([('lon', 'f8'), ('lat', 'f8'), ('elev', 'f4')])
print("Ex28 dtype itemsize:", dt_meta.itemsize)
print("Ex28 offsets:", {name: dt_meta.fields[name][1] for name in dt_meta.names})

# 29. structured array broadcasting (operate on field)
arr_broadcast = np.array([(1, 2.), (3, 4.), (5, 6.)],
                          dtype=[('i', 'i4'), ('f', 'f8')])
arr_broadcast['f'] *= 2
print("Ex29 doubled f:", arr_broadcast['f'])

# 30. recarray attribute access
rec2 = np.rec.array(students.copy())
print("Ex30 rec.age:", rec2.age)

# --- ADVANCED ---

# 31. custom dtype with methods (via recarray subclass)
class StudentArray(np.recarray):
    def honor_roll(self):
        return self[self.score >= 90]

sa = students.view(np.recarray).view(StudentArray)
print("Ex31 honor roll:", sa.honor_roll()['name'])

# 32. dtype alignment padding inspection
dt_packed = np.dtype([('a', 'i1'), ('b', 'i4'), ('c', 'i1')])
dt_align = np.dtype([('a', 'i1'), ('b', 'i4'), ('c', 'i1')], align=True)
print("Ex32 packed size:", dt_packed.itemsize, "aligned size:", dt_align.itemsize)

# 33. union-like dtype using void
dt_union = np.dtype({'names': ['as_float', 'as_int'],
                     'formats': ['f4', 'i4'],
                     'offsets': [0, 0],
                     'itemsize': 4})
union_arr = np.zeros(3, dtype=dt_union)
union_arr['as_float'] = np.array([1.5, 2.5, 3.5], dtype='f4')
print("Ex33 as_int view:", union_arr['as_int'])

# 34. memory layout of structured array
print("Ex34 is C-contiguous:", students.flags['C_CONTIGUOUS'])
print("Ex34 strides:", students.strides)

# 35. convert structured array to 2D float array
def struct_to_float(arr_s, fields):
    return np.column_stack([arr_s[f].astype(float) for f in fields])
float_arr = struct_to_float(students, ['age', 'score'])
print("Ex35 float array:", float_arr)

# 36. hierarchical structured dtype (event log)
dt_event = np.dtype([
    ('header', [('id', 'i4'), ('priority', 'i2')]),
    ('payload', [('value', 'f8'), ('flags', 'u1')]),
])
events = np.zeros(10, dtype=dt_event)
events['header']['id'] = np.arange(10)
events['header']['priority'] = np.random.randint(1, 5, 10)
events['payload']['value'] = np.random.rand(10)
print("Ex36 event priorities:", events['header']['priority'])

# 37. partial load of structured fields from binary file
import tempfile
import os
tmpf = tempfile.mktemp(suffix='.dat')
students.tofile(tmpf)
loaded_back = np.fromfile(tmpf, dtype=dt1)
print("Ex37 loaded names:", loaded_back['name'])
os.remove(tmpf)

# 38. structured array fancy indexing
idx_fancy = np.array([2, 0, 1])
print("Ex38 fancy indexed:", students[idx_fancy]['name'])

# 39. compress structured array (keep fields subset)
def keep_fields(arr_kf, fields):
    new_dt = np.dtype([(f, arr_kf.dtype.fields[f][0]) for f in fields])
    new_arr = np.empty(len(arr_kf), dtype=new_dt)
    for f in fields:
        new_arr[f] = arr_kf[f]
    return new_arr
slim = keep_fields(students, ['name', 'score'])
print("Ex39 slim dtype:", slim.dtype)

# 40. rolling window on structured field
n_roll = 20
ts_data = np.array(list(zip(np.arange(n_roll), np.random.rand(n_roll))),
                   dtype=[('t', 'i4'), ('v', 'f8')])
window_size = 5
rolling_v = np.array([ts_data['v'][i:i+window_size].mean()
                       for i in range(n_roll - window_size + 1)])
print("Ex40 rolling mean shape:", rolling_v.shape)

# 41. merge two structured arrays by aligned index
n_merge = 5
arr_left = np.array(list(zip(range(n_merge), np.random.rand(n_merge))),
                    dtype=[('id', 'i4'), ('a', 'f8')])
arr_right = np.array(list(zip(range(n_merge), np.random.rand(n_merge))),
                     dtype=[('id', 'i4'), ('b', 'f8')])
dt_merged = np.dtype([('id', 'i4'), ('a', 'f8'), ('b', 'f8')])
merged = np.empty(n_merge, dtype=dt_merged)
merged['id'] = arr_left['id']
merged['a'] = arr_left['a']
merged['b'] = arr_right['b']
print("Ex41 merged dtype:", merged.dtype.names)

# 42. dtype-based serialization and deserialization
import io
buf = io.BytesIO()
np.save(buf, students)
buf.seek(0)
loaded_students = np.load(buf, allow_pickle=True)
print("Ex42 loaded back names:", loaded_students['name'])

# --- EXPERT ---

# 43. custom dtype factory function
def make_particle_dtype(n_dims=3):
    return np.dtype([
        ('position', 'f8', (n_dims,)),
        ('velocity', 'f8', (n_dims,)),
        ('mass', 'f8'),
        ('charge', 'f4'),
        ('alive', 'bool'),
    ])
particle_dt = make_particle_dtype(3)
particles = np.zeros(100, dtype=particle_dt)
particles['position'] = np.random.randn(100, 3)
particles['velocity'] = np.random.randn(100, 3)
particles['mass'] = np.random.uniform(0.5, 2., 100)
particles['alive'] = True
print("Ex43 particle dtype fields:", particle_dt.names)

# 44. structured array with variable-length simulation (fixed max)
dt_track = np.dtype([('n_hits', 'i4'), ('hits', 'f8', (10,))])  # max 10 hits
tracks = np.zeros(20, dtype=dt_track)
for i in range(20):
    n = np.random.randint(1, 11)
    tracks[i]['n_hits'] = n
    tracks[i]['hits'][:n] = np.random.rand(n)
print("Ex44 track hit counts:", tracks['n_hits'][:5])

# 45. dtype with object fields (Python objects)
dt_obj = np.dtype([('key', 'U10'), ('data', object)])
obj_arr = np.empty(3, dtype=dt_obj)
obj_arr['key'] = ['a', 'b', 'c']
obj_arr['data'] = [{'v': 1}, [1, 2, 3], np.array([1., 2.])]
print("Ex45 object dtype:", obj_arr['key'])

# 46. structured array performance: field access vs column slice
large_struct = np.zeros(10_000, dtype=[('a', 'f8'), ('b', 'f8'), ('c', 'f8')])
large_struct['a'] = np.random.rand(10_000)
large_struct['b'] = np.random.rand(10_000)
large_struct['c'] = np.random.rand(10_000)
# Field access is non-contiguous for structured arrays
result_field = large_struct['a'].mean()
print("Ex46 structured field mean:", round(result_field, 4))

# 47. build an index on a structured array field
def build_index(arr_bi, field):
    sort_order = np.argsort(arr_bi[field])
    sorted_vals = arr_bi[field][sort_order]
    def lookup(val):
        idx_lo = np.searchsorted(sorted_vals, val)
        return sort_order[idx_lo] if idx_lo < len(sorted_vals) else -1
    return lookup
lookup_fn = build_index(all_students, 'score')
idx_found = lookup_fn(87.0)
print("Ex47 index lookup:", idx_found)

# 48. dtype-aware comparison and deduplication
dup_students = np.concatenate([students, students[:2]])
_, unique_idx = np.unique(dup_students['name'], return_index=True)
deduped = dup_students[unique_idx]
print("Ex48 deduped count:", len(deduped))

# 49. structured array rolling statistics
n_roll_49 = 100
ts_struct = np.zeros(n_roll_49, dtype=[('t', 'i8'), ('value', 'f8')])
ts_struct['t'] = np.arange(n_roll_49)
ts_struct['value'] = np.random.randn(n_roll_49)
win_49 = 10
stats_win = np.array([
    (ts_struct['value'][i:i+win_49].mean(), ts_struct['value'][i:i+win_49].std())
    for i in range(n_roll_49 - win_49 + 1)
], dtype=[('mean', 'f8'), ('std', 'f8')])
print("Ex49 rolling stats shape:", stats_win.shape)

# 50. production schema with validation
def create_validated_record(name, age, score):
    if not isinstance(name, str) or len(name) > 20:
        raise ValueError("name must be str <= 20 chars")
    if not (0 <= age <= 150):
        raise ValueError("age must be 0-150")
    if not (0. <= score <= 100.):
        raise ValueError("score must be 0-100")
    return np.array([(name, age, score)], dtype=dt1)[0]

try:
    good_rec = create_validated_record('Frank', 30, 88.5)
    print("Ex50 valid record:", good_rec)
except ValueError as e:
    print("Ex50 error:", e)

try:
    bad_rec = create_validated_record('X' * 25, 30, 88.5)
except ValueError as e:
    print("Ex50 caught error:", e)


def main():
    print("\nAll 50 examples ran successfully.")

if __name__ == "__main__":
    main()
