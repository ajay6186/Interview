# ============================================================
# Exercise 1.1 — NumPy & Pandas Basics
# ============================================================
# Topics:
#   • NumPy array creation and manipulation
#   • Statistical operations on arrays
#   • Pandas DataFrame construction and filtering
#   • GroupBy, merge, apply, and missing value handling
# ============================================================

import numpy as np
import pandas as pd
from io import StringIO

# ---------------------------------------------------------------------------
# TODO 1: Create a 1D array from 1 to 20 (inclusive) using np.arange
# ---------------------------------------------------------------------------
# Expected: array([ 1,  2,  3, ..., 20])

def create_range_array():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 2: Create a 3×3 matrix of zeros
# ---------------------------------------------------------------------------
# Expected: array([[0., 0., 0.], [0., 0., 0.], [0., 0., 0.]])

def create_zeros_matrix():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 3: Create a 3×3 identity matrix
# ---------------------------------------------------------------------------
# Expected: array([[1., 0., 0.], [0., 1., 0.], [0., 0., 1.]])

def create_identity_matrix():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 4: Create an array of 10 evenly spaced values between 0 and 1
# ---------------------------------------------------------------------------
# Expected: array([0.   , 0.111, 0.222, ..., 1.   ])  (10 values)

def create_linspace_array():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 5: Compute mean, std, min, max of the array [4, 7, 13, 2, 1, 9, 15, 6]
# ---------------------------------------------------------------------------
# Return a dict with keys 'mean', 'std', 'min', 'max'

def compute_stats():
    arr = np.array([4, 7, 13, 2, 1, 9, 15, 6])
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 6: Reshape a 1D array of 12 elements into shape (3, 4)
# ---------------------------------------------------------------------------
# Use np.arange(12) as the source array
# Expected shape: (3, 4)

def reshape_array():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 7: Create a DataFrame from a dict with columns: name, age, salary
# ---------------------------------------------------------------------------
# Use these values:
#   name:   ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']
#   age:    [25, 32, 28, 45, 36]
#   salary: [48000, 72000, 55000, 90000, 61000]

def create_dataframe():
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 8: Filter rows where salary > 50000 from the DataFrame above
# ---------------------------------------------------------------------------

def filter_high_earners(df):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 9: Add a boolean column 'senior' that is True if age >= 30
# ---------------------------------------------------------------------------
# Return the updated DataFrame

def add_senior_column(df):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 10: Group the DataFrame by 'senior' and compute the mean of numeric cols
# ---------------------------------------------------------------------------

def groupby_senior_mean(df):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 11: Read a CSV-like string using pd.read_csv with StringIO
# ---------------------------------------------------------------------------
# Parse this CSV string and return the resulting DataFrame:
CSV_DATA = """product,price,quantity
apple,1.2,100
banana,0.5,200
cherry,3.0,50
date,5.5,30
"""

def read_csv_from_string():
    pass  # TODO: implement (use StringIO)

# ---------------------------------------------------------------------------
# TODO 12: Handle missing values
# ---------------------------------------------------------------------------
# Given the DataFrame below, fill numeric NaN with column mean,
# then drop any remaining rows that still have NaN.
# Return the cleaned DataFrame.
MISSING_DATA = pd.DataFrame({
    'A': [1.0, 2.0, np.nan, 4.0, 5.0],
    'B': [np.nan, 2.0, 3.0, np.nan, 5.0],
    'C': ['x', 'y', np.nan, 'w', 'v'],
})

def handle_missing_values(df):
    pass  # TODO: implement (fillna for numeric, dropna for remaining)

# ---------------------------------------------------------------------------
# TODO 13: Sort a DataFrame by multiple columns
# ---------------------------------------------------------------------------
# Sort the employee DataFrame by 'senior' descending, then 'salary' ascending.
# Return the sorted DataFrame.

def sort_dataframe(df):
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 14: Merge two DataFrames on a key column
# ---------------------------------------------------------------------------
# df1 has columns: employee_id, name
# df2 has columns: employee_id, department
# Return an inner-merged DataFrame.

def merge_dataframes():
    df1 = pd.DataFrame({
        'employee_id': [1, 2, 3, 4],
        'name': ['Alice', 'Bob', 'Charlie', 'Diana']
    })
    df2 = pd.DataFrame({
        'employee_id': [2, 3, 4, 5],
        'department': ['Engineering', 'Marketing', 'HR', 'Finance']
    })
    pass  # TODO: implement

# ---------------------------------------------------------------------------
# TODO 15: Apply a custom function to a column
# ---------------------------------------------------------------------------
# Apply a function to the 'salary' column of the employee DataFrame
# that returns 'high' if salary >= 65000 else 'low'.
# Add the result as a new column 'salary_band'.
# Return the updated DataFrame.

def apply_salary_band(df):
    pass  # TODO: implement

# ---------------------------------------------------------------------------

def main():
    print("=== Exercise 1.1: NumPy & Pandas Basics ===\n")

    print("TODO 1 — Range array:", create_range_array())
    print("TODO 2 — Zeros matrix:\n", create_zeros_matrix())
    print("TODO 3 — Identity matrix:\n", create_identity_matrix())
    print("TODO 4 — Linspace array:", create_linspace_array())
    print("TODO 5 — Stats:", compute_stats())
    print("TODO 6 — Reshaped array:\n", reshape_array())

    df = create_dataframe()
    print("\nTODO 7 — DataFrame:\n", df)
    print("\nTODO 8 — High earners:\n", filter_high_earners(df))

    df = add_senior_column(df)
    print("\nTODO 9 — With senior column:\n", df)
    print("\nTODO 10 — GroupBy senior mean:\n", groupby_senior_mean(df))

    print("\nTODO 11 — CSV from string:\n", read_csv_from_string())
    print("\nTODO 12 — Missing values handled:\n", handle_missing_values(MISSING_DATA.copy()))
    print("\nTODO 13 — Sorted DataFrame:\n", sort_dataframe(df))
    print("\nTODO 14 — Merged DataFrame:\n", merge_dataframes())

    df2 = apply_salary_band(df.copy())
    print("\nTODO 15 — Salary band column:\n", df2)

if __name__ == "__main__":
    main()
