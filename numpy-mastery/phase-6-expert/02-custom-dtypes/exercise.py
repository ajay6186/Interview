# ============================================================================
# Exercise 6.2 — Custom Dtypes
# ============================================================================
# Build and manipulate structured arrays with compound dtypes: define fields,
# access data, sort, filter, group, and join structured arrays.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python exercise.py
# ============================================================================

import numpy as np

np.random.seed(0)

# ---------------------------------------------------------------------------
# 1. Define a structured dtype with fields: name (U20), age (i4), score (f8)
# ---------------------------------------------------------------------------

# TODO: define the dtype using np.dtype with a list of (name, type) tuples
student_dtype = None  # replace None

# ---------------------------------------------------------------------------
# 2. Create a structured array from a list of tuples
# ---------------------------------------------------------------------------

# TODO: create students array with dtype=student_dtype from these tuples:
#  ('Alice', 25, 92.5), ('Bob', 22, 87.3), ('Carol', 28, 95.1), ('Dave', 21, 78.9)
students = None  # replace None

# ---------------------------------------------------------------------------
# 3. Access a single field
# ---------------------------------------------------------------------------

# TODO: extract the 'score' field as a 1D array
scores = None  # replace None

# ---------------------------------------------------------------------------
# 4. Filter: rows where score > 90
# ---------------------------------------------------------------------------

# TODO: boolean index students where score > 90
high_scorers = None  # replace None

# ---------------------------------------------------------------------------
# 5. Sort by score (ascending)
# ---------------------------------------------------------------------------

# TODO: sort students by 'score' field using np.sort with order='score'
students_sorted = None  # replace None

# ---------------------------------------------------------------------------
# 6. Nested structured dtype
# ---------------------------------------------------------------------------

# TODO: define a dtype with:
#   - 'coords' field: a sub-dtype with 'lat' (f8) and 'lon' (f8)
#   - 'altitude' field: f4
point_dtype = None  # replace None

# TODO: create a zero-filled structured array of shape (5,) with point_dtype
points = None  # replace None

# TODO: fill points['coords']['lat'] with np.linspace(40, 50, 5)
#   and points['coords']['lon'] with np.linspace(-10, 0, 5)

# ---------------------------------------------------------------------------
# 7. One-hot encode a categorical field
# ---------------------------------------------------------------------------

grades = np.array(['A', 'B', 'A', 'C', 'B', 'A'], dtype='U1')
categories = np.array(['A', 'B', 'C'])

# TODO: create a one-hot matrix ohe of shape (6, 3) where
#       ohe[i, j] = 1 if grades[i] == categories[j] else 0
ohe = None  # replace None

# ---------------------------------------------------------------------------
# 8. Structured array join (inner join by 'id' field)
# ---------------------------------------------------------------------------

dt_left  = np.dtype([('id', 'i4'), ('val_a', 'f8')])
dt_right = np.dtype([('id', 'i4'), ('val_b', 'f8')])
left  = np.array([(1, 1.1), (2, 2.2), (3, 3.3), (4, 4.4)], dtype=dt_left)
right = np.array([(1, 10.), (3, 30.), (5, 50.)], dtype=dt_right)

# TODO: find common ids using np.intersect1d on left['id'] and right['id']
common_ids = None  # replace None

# TODO: filter left and right to only common_ids using np.isin
left_filtered  = None  # replace None
right_filtered = None  # replace None

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert student_dtype is not None, "student_dtype must be defined"
    assert isinstance(student_dtype, np.dtype), "student_dtype should be np.dtype"
    assert student_dtype.names == ('name', 'age', 'score'), \
        f"Fields should be ('name','age','score'), got {student_dtype.names}"
    assert student_dtype['name'].kind == 'U', "name should be unicode string"
    assert student_dtype['age'] == np.int32, "age should be int32 (i4)"
    assert student_dtype['score'] == np.float64, "score should be float64 (f8)"

    assert students is not None, "students must be defined"
    assert len(students) == 4, "students should have 4 records"
    assert students.dtype == student_dtype, "students dtype mismatch"
    assert list(students['name']) == ['Alice', 'Bob', 'Carol', 'Dave']

    assert scores is not None, "scores must be defined"
    assert scores.shape == (4,), "scores should have shape (4,)"
    assert np.allclose(scores, [92.5, 87.3, 95.1, 78.9]), "scores values mismatch"

    assert high_scorers is not None, "high_scorers must be defined"
    assert len(high_scorers) == 2, f"2 students with score > 90, got {len(high_scorers)}"
    assert set(high_scorers['name']) == {'Alice', 'Carol'}, "wrong high scorers"

    assert students_sorted is not None, "students_sorted must be defined"
    assert students_sorted[0]['name'] == 'Dave', \
        f"First sorted student should be Dave (lowest score), got {students_sorted[0]['name']}"
    assert students_sorted[-1]['name'] == 'Carol', \
        f"Last sorted student should be Carol (highest score), got {students_sorted[-1]['name']}"
    assert np.all(students_sorted['score'][:-1] <= students_sorted['score'][1:]), \
        "scores should be in ascending order"

    assert point_dtype is not None, "point_dtype must be defined"
    assert 'coords' in point_dtype.names, "point_dtype should have 'coords' field"
    assert 'altitude' in point_dtype.names, "point_dtype should have 'altitude' field"
    assert 'lat' in point_dtype['coords'].names, "coords should have 'lat' sub-field"
    assert 'lon' in point_dtype['coords'].names, "coords should have 'lon' sub-field"

    assert points is not None, "points must be defined"
    assert points.shape == (5,), "points should have shape (5,)"
    assert np.allclose(points['coords']['lat'], np.linspace(40, 50, 5)), \
        "lat values should be linspace(40, 50, 5)"
    assert np.allclose(points['coords']['lon'], np.linspace(-10, 0, 5)), \
        "lon values should be linspace(-10, 0, 5)"

    assert ohe is not None, "ohe must be defined"
    assert ohe.shape == (6, 3), f"ohe shape should be (6, 3), got {ohe.shape}"
    assert np.all(ohe.sum(axis=1) == 1), "each row should have exactly one 1"
    assert np.all((ohe == 0) | (ohe == 1)), "ohe should be binary"
    assert ohe[0, 0] == 1, "grades[0]='A' should map to column 0"
    assert ohe[1, 1] == 1, "grades[1]='B' should map to column 1"
    assert ohe[3, 2] == 1, "grades[3]='C' should map to column 2"

    assert common_ids is not None, "common_ids must be defined"
    assert set(common_ids) == {1, 3}, f"common ids should be {{1, 3}}, got {set(common_ids)}"

    assert left_filtered is not None, "left_filtered must be defined"
    assert right_filtered is not None, "right_filtered must be defined"
    assert len(left_filtered) == 2, "left_filtered should have 2 rows"
    assert len(right_filtered) == 2, "right_filtered should have 2 rows"
    assert set(left_filtered['id']) == {1, 3}, "left_filtered ids should be {1, 3}"
    assert set(right_filtered['id']) == {1, 3}, "right_filtered ids should be {1, 3}"

    print("Exercise 6.2 — All assertions passed!")

if __name__ == "__main__":
    main()
