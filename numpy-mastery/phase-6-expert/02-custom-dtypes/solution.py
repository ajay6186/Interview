# ============================================================================
# Solution 6.2 — Custom Dtypes
# ============================================================================

import numpy as np

np.random.seed(0)

# 1. Structured dtype
student_dtype = np.dtype([('name', 'U20'), ('age', 'i4'), ('score', 'f8')])

# 2. Structured array
students = np.array([
    ('Alice', 25, 92.5),
    ('Bob', 22, 87.3),
    ('Carol', 28, 95.1),
    ('Dave', 21, 78.9),
], dtype=student_dtype)

# 3. Access field
scores = students['score']

# 4. Filter
high_scorers = students[students['score'] > 90]

# 5. Sort
students_sorted = np.sort(students, order='score')

# 6. Nested dtype
point_dtype = np.dtype([
    ('coords', [('lat', 'f8'), ('lon', 'f8')]),
    ('altitude', 'f4'),
])
points = np.zeros(5, dtype=point_dtype)
points['coords']['lat'] = np.linspace(40, 50, 5)
points['coords']['lon'] = np.linspace(-10, 0, 5)

# 7. One-hot encoding
grades = np.array(['A', 'B', 'A', 'C', 'B', 'A'], dtype='U1')
categories = np.array(['A', 'B', 'C'])
ohe = (grades[:, None] == categories[None, :]).astype(int)

# 8. Inner join
dt_left  = np.dtype([('id', 'i4'), ('val_a', 'f8')])
dt_right = np.dtype([('id', 'i4'), ('val_b', 'f8')])
left  = np.array([(1, 1.1), (2, 2.2), (3, 3.3), (4, 4.4)], dtype=dt_left)
right = np.array([(1, 10.), (3, 30.), (5, 50.)], dtype=dt_right)
common_ids = np.intersect1d(left['id'], right['id'])
left_filtered  = left[np.isin(left['id'], common_ids)]
right_filtered = right[np.isin(right['id'], common_ids)]

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert student_dtype is not None
    assert isinstance(student_dtype, np.dtype)
    assert student_dtype.names == ('name', 'age', 'score')
    assert student_dtype['name'].kind == 'U'
    assert student_dtype['age'] == np.int32
    assert student_dtype['score'] == np.float64

    assert students is not None
    assert len(students) == 4
    assert students.dtype == student_dtype
    assert list(students['name']) == ['Alice', 'Bob', 'Carol', 'Dave']

    assert scores is not None
    assert scores.shape == (4,)
    assert np.allclose(scores, [92.5, 87.3, 95.1, 78.9])

    assert high_scorers is not None
    assert len(high_scorers) == 2
    assert set(high_scorers['name']) == {'Alice', 'Carol'}

    assert students_sorted is not None
    assert students_sorted[0]['name'] == 'Dave'
    assert students_sorted[-1]['name'] == 'Carol'
    assert np.all(students_sorted['score'][:-1] <= students_sorted['score'][1:])

    assert point_dtype is not None
    assert 'coords' in point_dtype.names
    assert 'altitude' in point_dtype.names
    assert 'lat' in point_dtype['coords'].names
    assert 'lon' in point_dtype['coords'].names

    assert points is not None
    assert points.shape == (5,)
    assert np.allclose(points['coords']['lat'], np.linspace(40, 50, 5))
    assert np.allclose(points['coords']['lon'], np.linspace(-10, 0, 5))

    assert ohe is not None
    assert ohe.shape == (6, 3)
    assert np.all(ohe.sum(axis=1) == 1)
    assert np.all((ohe == 0) | (ohe == 1))
    assert ohe[0, 0] == 1
    assert ohe[1, 1] == 1
    assert ohe[3, 2] == 1

    assert common_ids is not None
    assert set(common_ids) == {1, 3}

    assert left_filtered is not None
    assert right_filtered is not None
    assert len(left_filtered) == 2
    assert len(right_filtered) == 2
    assert set(left_filtered['id']) == {1, 3}
    assert set(right_filtered['id']) == {1, 3}

    print("Solution 6.2 — All assertions passed!")

if __name__ == "__main__":
    main()
