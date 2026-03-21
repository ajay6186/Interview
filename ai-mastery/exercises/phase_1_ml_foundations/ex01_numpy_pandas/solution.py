# ============================================================
# Solution 1.1 — NumPy & Pandas Basics
# ============================================================

import numpy as np
import pandas as pd
from io import StringIO

# ---------------------------------------------------------------------------
# TODO 1: Create a 1D array from 1 to 20 (inclusive)
# ---------------------------------------------------------------------------

def create_range_array():
    return np.arange(1, 21)

# ---------------------------------------------------------------------------
# TODO 2: Create a 3×3 matrix of zeros
# ---------------------------------------------------------------------------

def create_zeros_matrix():
    return np.zeros((3, 3))

# ---------------------------------------------------------------------------
# TODO 3: Create a 3×3 identity matrix
# ---------------------------------------------------------------------------

def create_identity_matrix():
    return np.eye(3)

# ---------------------------------------------------------------------------
# TODO 4: Create 10 evenly spaced values between 0 and 1
# ---------------------------------------------------------------------------

def create_linspace_array():
    return np.linspace(0, 1, 10)

# ---------------------------------------------------------------------------
# TODO 5: Compute mean, std, min, max
# ---------------------------------------------------------------------------

def compute_stats():
    arr = np.array([4, 7, 13, 2, 1, 9, 15, 6])
    return {
        'mean': arr.mean(),
        'std':  arr.std(),
        'min':  arr.min(),
        'max':  arr.max(),
    }

# ---------------------------------------------------------------------------
# TODO 6: Reshape (12,) → (3, 4)
# ---------------------------------------------------------------------------

def reshape_array():
    return np.arange(12).reshape(3, 4)

# ---------------------------------------------------------------------------
# TODO 7: Create a DataFrame
# ---------------------------------------------------------------------------

def create_dataframe():
    return pd.DataFrame({
        'name':   ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
        'age':    [25, 32, 28, 45, 36],
        'salary': [48000, 72000, 55000, 90000, 61000],
    })

# ---------------------------------------------------------------------------
# TODO 8: Filter rows where salary > 50000
# ---------------------------------------------------------------------------

def filter_high_earners(df):
    return df[df['salary'] > 50000]

# ---------------------------------------------------------------------------
# TODO 9: Add 'senior' boolean column (age >= 30)
# ---------------------------------------------------------------------------

def add_senior_column(df):
    df = df.copy()
    df['senior'] = df['age'] >= 30
    return df

# ---------------------------------------------------------------------------
# TODO 10: GroupBy 'senior', compute mean of numeric columns
# ---------------------------------------------------------------------------

def groupby_senior_mean(df):
    return df.groupby('senior').mean(numeric_only=True)

# ---------------------------------------------------------------------------
# TODO 11: Read CSV string via StringIO
# ---------------------------------------------------------------------------

CSV_DATA = """product,price,quantity
apple,1.2,100
banana,0.5,200
cherry,3.0,50
date,5.5,30
"""

def read_csv_from_string():
    return pd.read_csv(StringIO(CSV_DATA))

# ---------------------------------------------------------------------------
# TODO 12: Handle missing values
# ---------------------------------------------------------------------------

MISSING_DATA = pd.DataFrame({
    'A': [1.0, 2.0, np.nan, 4.0, 5.0],
    'B': [np.nan, 2.0, 3.0, np.nan, 5.0],
    'C': ['x', 'y', np.nan, 'w', 'v'],
})

def handle_missing_values(df):
    # Fill numeric columns with their column mean
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].mean())
    # Drop rows with any remaining NaN (e.g. object columns)
    df = df.dropna()
    return df

# ---------------------------------------------------------------------------
# TODO 13: Sort by multiple columns
# ---------------------------------------------------------------------------

def sort_dataframe(df):
    return df.sort_values(by=['senior', 'salary'], ascending=[False, True])

# ---------------------------------------------------------------------------
# TODO 14: Merge two DataFrames
# ---------------------------------------------------------------------------

def merge_dataframes():
    df1 = pd.DataFrame({
        'employee_id': [1, 2, 3, 4],
        'name': ['Alice', 'Bob', 'Charlie', 'Diana']
    })
    df2 = pd.DataFrame({
        'employee_id': [2, 3, 4, 5],
        'department': ['Engineering', 'Marketing', 'HR', 'Finance']
    })
    return pd.merge(df1, df2, on='employee_id', how='inner')

# ---------------------------------------------------------------------------
# TODO 15: Apply custom salary_band function
# ---------------------------------------------------------------------------

def apply_salary_band(df):
    df = df.copy()
    df['salary_band'] = df['salary'].apply(
        lambda s: 'high' if s >= 65000 else 'low'
    )
    return df

# ---------------------------------------------------------------------------

def main():
    print("=== Solution 1.1: NumPy & Pandas Basics ===\n")

    print("Result 1  — Range array:", create_range_array())
    print("Result 2  — Zeros matrix:\n", create_zeros_matrix())
    print("Result 3  — Identity matrix:\n", create_identity_matrix())
    print("Result 4  — Linspace array:", create_linspace_array())
    print("Result 5  — Stats:", compute_stats())
    print("Result 6  — Reshaped array:\n", reshape_array())

    df = create_dataframe()
    print("\nResult 7  — DataFrame:\n", df)
    print("\nResult 8  — High earners:\n", filter_high_earners(df))

    df = add_senior_column(df)
    print("\nResult 9  — With senior column:\n", df)
    print("\nResult 10 — GroupBy senior mean:\n", groupby_senior_mean(df))
    print("\nResult 11 — CSV from string:\n", read_csv_from_string())
    print("\nResult 12 — Missing values handled:\n", handle_missing_values(MISSING_DATA.copy()))
    print("\nResult 13 — Sorted DataFrame:\n", sort_dataframe(df))
    print("\nResult 14 — Merged DataFrame:\n", merge_dataframes())

    df2 = apply_salary_band(df.copy())
    print("\nResult 15 — Salary band column:\n", df2[['name', 'salary', 'salary_band']])

if __name__ == "__main__":
    main()
