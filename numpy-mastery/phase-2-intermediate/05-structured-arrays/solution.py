# ============================================================================
# Solution 2.5 — Structured Arrays
# ============================================================================
# Learn to create structured dtypes with named fields, build structured arrays
# to represent record-like data, access fields by name, and sort on a field.
#
# Instructions: Fill in every TODO so the file runs without errors
#               and all assertions pass.
# Run with: python solution.py
# ============================================================================

import numpy as np

# ---------------------------------------------------------------------------
# 1. Define a structured dtype
# ---------------------------------------------------------------------------

# Create a structured dtype called 'employee_dtype' with:
#   - 'name'   : Unicode string of max length 20 (U20)
#   - 'age'    : 32-bit integer (i4)
#   - 'salary' : 64-bit float (f8)
employee_dtype = np.dtype([('name', 'U20'), ('age', 'i4'), ('salary', 'f8')])

# ---------------------------------------------------------------------------
# 2. Create a structured array
# ---------------------------------------------------------------------------

# Create a structured numpy array of 4 employees using employee_dtype
employees = np.array([
    ('Alice', 30, 70000.0),
    ('Bob',   25, 55000.0),
    ('Carol', 35, 90000.0),
    ('Dave',  28, 62000.0),
], dtype=employee_dtype)

# ---------------------------------------------------------------------------
# 3. Access fields by name
# ---------------------------------------------------------------------------

# Extract the 'name' field as an array
names = employees['name']

# Extract the 'salary' field as an array
salaries = employees['salary']

# Compute the mean salary
mean_salary = np.mean(salaries)

# ---------------------------------------------------------------------------
# 4. Boolean mask on structured array
# ---------------------------------------------------------------------------

# Create a mask for employees with salary > 60000
high_earner_mask = employees['salary'] > 60000

# Use the mask to get the names of high earners
high_earner_names = employees['name'][high_earner_mask]

# ---------------------------------------------------------------------------
# 5. Sort structured array by a field
# ---------------------------------------------------------------------------

# Sort the employees array by 'age' in ascending order
sorted_by_age = np.sort(employees, order='age')

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def main():
    assert employee_dtype is not None, "employee_dtype must be defined"
    assert employee_dtype.names == ('name', 'age', 'salary'), \
        f"field names wrong: {employee_dtype.names}"

    assert employees is not None, "employees must be defined"
    assert employees.dtype == employee_dtype, "employees should use employee_dtype"
    assert len(employees) == 4, "should have 4 employees"

    assert names is not None, "names must be defined"
    assert list(names) == ['Alice', 'Bob', 'Carol', 'Dave'], f"names wrong: {names}"

    assert salaries is not None, "salaries must be defined"
    assert np.allclose(salaries, [70000., 55000., 90000., 62000.]), f"salaries wrong"

    assert mean_salary is not None, "mean_salary must be defined"
    assert np.isclose(mean_salary, 69250.0), f"mean_salary should be 69250, got {mean_salary}"

    assert high_earner_mask is not None, "high_earner_mask must be defined"
    assert list(high_earner_mask) == [True, False, True, True], \
        f"high_earner_mask wrong: {high_earner_mask}"

    assert high_earner_names is not None, "high_earner_names must be defined"
    assert list(high_earner_names) == ['Alice', 'Carol', 'Dave'], \
        f"high_earner_names wrong: {high_earner_names}"

    assert sorted_by_age is not None, "sorted_by_age must be defined"
    ages_sorted = sorted_by_age['age']
    assert list(ages_sorted) == [25, 28, 30, 35], f"ages not sorted: {ages_sorted}"
    assert sorted_by_age['name'][0] == 'Bob', "youngest should be Bob"

    print("Solution 2.5 — All assertions passed!")

if __name__ == "__main__":
    main()
