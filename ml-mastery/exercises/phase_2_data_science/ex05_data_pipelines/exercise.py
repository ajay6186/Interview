# ============================================================
# Exercise 2.5 — Data Pipelines
# ============================================================
# Topics:
#   • CSV loading and column name cleaning
#   • Type casting, row filtering, aggregation
#   • DataFrame merging, pivot table, melt
#   • Chunk processing concept
#   • Schema validation
#   • Data lineage tracking
#   • Idempotent transformations
#   • Feature store (parquet save/load)
#   • Data versioning (hash)
#   • Full ETL pipeline class
# ============================================================

import numpy as np
import pandas as pd
import hashlib
import os
import io
import tempfile
from typing import Dict, List, Any

# ---------------------------------------------------------------------------
# TODO 1: Read CSV with Pandas
# ---------------------------------------------------------------------------
# Read a CSV string (or file path) into a DataFrame.
# If given a string, use io.StringIO. Return the DataFrame.
# Expected: read_csv_data(csv_string) → DataFrame

def read_csv_data(source: str) -> pd.DataFrame:
    pass  # TODO: implement — try as file path first, fall back to StringIO


# ---------------------------------------------------------------------------
# TODO 2: Clean Column Names
# ---------------------------------------------------------------------------
# Clean DataFrame column names:
#   - Strip leading/trailing whitespace
#   - Convert to lowercase
#   - Replace spaces with underscores
#   - Remove special characters (keep only alphanumeric and underscores)
# Return DataFrame with cleaned column names.
# Expected: clean_column_names(df) with " First Name " → "first_name"

def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    pass  # TODO: implement using str operations on df.columns


# ---------------------------------------------------------------------------
# TODO 3: Type Casting
# ---------------------------------------------------------------------------
# Cast DataFrame columns according to a dtype_map dict: {col_name: dtype_str}
# Example: {"age": "int64", "price": "float64", "active": "bool"}
# Return DataFrame with converted dtypes. Skip columns not in DataFrame.
# Expected: cast_dtypes(df, {"age":"int64","score":"float64"}) → converted df

def cast_dtypes(df: pd.DataFrame, dtype_map: Dict[str, str]) -> pd.DataFrame:
    pass  # TODO: implement using df.astype for each mapping


# ---------------------------------------------------------------------------
# TODO 4: Filter Rows by Condition
# ---------------------------------------------------------------------------
# Filter DataFrame rows using a query string (pandas df.query syntax) or
# a callable that takes a row and returns bool.
# Return the filtered DataFrame.
# Expected: filter_rows(df, "age > 25") or filter_rows(df, lambda r: r["age"] > 25)

def filter_rows(df: pd.DataFrame, condition) -> pd.DataFrame:
    pass  # TODO: implement — if string, use df.query; if callable, use df.apply


# ---------------------------------------------------------------------------
# TODO 5: Aggregate (GroupBy + Agg)
# ---------------------------------------------------------------------------
# Given a DataFrame, group by group_col and compute aggregations specified
# in agg_dict: {col: ["mean", "sum", "count"], ...}
# Return the aggregated DataFrame.
# Expected: aggregate(df, "category", {"value": ["mean","sum","count"]})

def aggregate(df: pd.DataFrame, group_col: str, agg_dict: Dict) -> pd.DataFrame:
    pass  # TODO: implement using df.groupby(group_col).agg(agg_dict)


# ---------------------------------------------------------------------------
# TODO 6: Merge Two DataFrames
# ---------------------------------------------------------------------------
# Merge df_left and df_right on the specified key column(s), with the given
# how (inner/left/right/outer). Return the merged DataFrame.
# Expected: merge_dfs(left, right, on="id", how="inner")

def merge_dfs(df_left: pd.DataFrame, df_right: pd.DataFrame,
              on: str, how: str = "inner") -> pd.DataFrame:
    pass  # TODO: implement using pd.merge


# ---------------------------------------------------------------------------
# TODO 7: Pivot Table
# ---------------------------------------------------------------------------
# Create a pivot table with index=index_col, columns=columns_col,
# values=values_col, aggfunc=aggfunc.
# Return the pivot DataFrame.
# Expected: pivot_table(df, "date", "category", "sales", "sum")

def pivot_table(df: pd.DataFrame, index_col: str, columns_col: str,
                values_col: str, aggfunc: str = "mean") -> pd.DataFrame:
    pass  # TODO: implement using df.pivot_table


# ---------------------------------------------------------------------------
# TODO 8: Melt (Wide → Long Format)
# ---------------------------------------------------------------------------
# Convert a wide-format DataFrame to long format using pd.melt.
# id_vars: columns to keep as identifiers
# value_vars: columns to melt into rows
# Return the melted DataFrame.
# Expected: melt_df(df, id_vars=["id"], value_vars=["q1","q2","q3"])

def melt_df(df: pd.DataFrame, id_vars: List[str], value_vars: List[str]) -> pd.DataFrame:
    pass  # TODO: implement using pd.melt


# ---------------------------------------------------------------------------
# TODO 9: Chunk Processing
# ---------------------------------------------------------------------------
# Simulate processing a large DataFrame in chunks of chunk_size rows.
# Apply transform_fn to each chunk and concatenate the results.
# Return the final DataFrame.
# Expected: chunk_process(df, transform_fn, chunk_size=100)

def chunk_process(df: pd.DataFrame, transform_fn, chunk_size: int = 100) -> pd.DataFrame:
    pass  # TODO: implement by splitting df into chunks and applying transform_fn


# ---------------------------------------------------------------------------
# TODO 10: Schema Validation
# ---------------------------------------------------------------------------
# Validate that a DataFrame has all required columns with correct dtypes.
# schema: {col_name: expected_dtype_str}
# Return list of error strings (empty if valid).
# Expected: validate_schema(df, {"age":"int64"}) → [] or ["age: expected int64, got float64"]

def validate_schema(df: pd.DataFrame, schema: Dict[str, str]) -> List[str]:
    pass  # TODO: implement


# ---------------------------------------------------------------------------
# TODO 11: Data Lineage Tracking
# ---------------------------------------------------------------------------
# Implement a simple lineage tracker that logs transformation steps.
# The tracker should have:
#   - add_step(step_name, description) method
#   - get_lineage() method that returns list of step dicts
# Expected: tracker.add_step("clean", "removed duplicates"); tracker.get_lineage()

class DataLineageTracker:
    def __init__(self):
        pass  # TODO: initialize a list to store steps

    def add_step(self, step_name: str, description: str, **metadata):
        pass  # TODO: append dict with step_name, description, timestamp, metadata

    def get_lineage(self) -> List[Dict]:
        pass  # TODO: return the list of steps

    def __repr__(self):
        pass  # TODO: return a readable string summary


# ---------------------------------------------------------------------------
# TODO 12: Idempotent Transformation
# ---------------------------------------------------------------------------
# An idempotent transformation gives the same result when applied multiple times.
# Implement idempotent_normalize that normalizes column "value" to [0,1] —
# applying it twice should give the same result as applying it once.
# Expected: f(f(df)) == f(df) for all inputs

def idempotent_normalize(df: pd.DataFrame, col: str = "value") -> pd.DataFrame:
    pass  # TODO: implement — normalize using actual min/max (min-max scaling)
          # Key insight: after first normalization, min=0, max=1, so second run is identity


# ---------------------------------------------------------------------------
# TODO 13: Feature Store Pattern
# ---------------------------------------------------------------------------
# Save a features DataFrame to a parquet file and load it back.
# Return the loaded DataFrame.
# Expected: feature_store_save_load(df, path) → same DataFrame

def feature_store_save_load(df: pd.DataFrame, filepath: str) -> pd.DataFrame:
    pass  # TODO: implement using df.to_parquet and pd.read_parquet


# ---------------------------------------------------------------------------
# TODO 14: Data Versioning
# ---------------------------------------------------------------------------
# Compute a deterministic hash of a DataFrame's contents for versioning.
# Convert to CSV string, then hash with MD5.
# Return the hex digest string.
# Expected: hash_dataframe(df) → "3f2a..." (same data = same hash)

def hash_dataframe(df: pd.DataFrame) -> str:
    pass  # TODO: implement using df.to_csv() and hashlib.md5


# ---------------------------------------------------------------------------
# TODO 15: Full ETL Pipeline Class
# ---------------------------------------------------------------------------
# Implement an ETL pipeline class with:
#   - extract(source) → loads DataFrame from CSV string/path
#   - transform(df) → cleans columns, drops nulls, casts dtypes
#   - load(df, filepath) → saves to parquet
#   - run(source, output_path) → orchestrates all 3 steps, returns final df

class ETLPipeline:
    def __init__(self, dtype_map: Dict = None, drop_nulls: bool = True):
        pass  # TODO: store config

    def extract(self, source: str) -> pd.DataFrame:
        pass  # TODO: use read_csv_data

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        pass  # TODO: clean columns, drop nulls if configured, cast dtypes

    def load(self, df: pd.DataFrame, filepath: str) -> None:
        pass  # TODO: save to parquet

    def run(self, source: str, output_path: str) -> pd.DataFrame:
        pass  # TODO: orchestrate extract → transform → load, return final df


def main():
    print("=== Exercise 2.5: Data Pipelines ===\n")

    csv_data = """id, First Name ,age,score,category
1,Alice,30,85.5,A
2,Bob,25,92.0,B
3,Charlie,35,78.3,A
4,Diana,28,95.1,B
5,Eve,22,88.7,A
1,Alice,30,85.5,A"""

    df = read_csv_data(csv_data)
    print("TODO 1 — Read CSV shape:", df.shape if df is not None else None)

    df_clean = clean_column_names(df) if df is not None else None
    print("TODO 2 — Cleaned columns:", list(df_clean.columns) if df_clean is not None else None)

    df_typed = cast_dtypes(df_clean, {"age": "int64", "score": "float64"}) if df_clean is not None else None
    print("TODO 3 — Dtypes:", df_typed.dtypes.to_dict() if df_typed is not None else None)

    df_filtered = filter_rows(df_typed, "age > 25") if df_typed is not None else None
    print("TODO 4 — Filtered rows:", len(df_filtered) if df_filtered is not None else None)

    agg_result = aggregate(df_typed, "category", {"score": ["mean", "min", "max"]}) if df_typed is not None else None
    print("TODO 5 — Aggregate:\n", agg_result)

    df_right = pd.DataFrame({"id": [1, 2, 3], "rank": ["gold", "silver", "bronze"]})
    merged = merge_dfs(df_typed, df_right, on="id") if df_typed is not None else None
    print("TODO 6 — Merged shape:", merged.shape if merged is not None else None)

    sales_df = pd.DataFrame({
        "date":     ["2024-01", "2024-01", "2024-02", "2024-02"],
        "category": ["A", "B", "A", "B"],
        "sales":    [100, 200, 150, 250],
    })
    piv = pivot_table(sales_df, "date", "category", "sales", "sum")
    print("TODO 7 — Pivot table:\n", piv)

    wide_df = pd.DataFrame({"id": [1, 2], "q1": [10, 20], "q2": [30, 40], "q3": [50, 60]})
    melted = melt_df(wide_df, id_vars=["id"], value_vars=["q1","q2","q3"])
    print("TODO 8 — Melted shape:", melted.shape if melted is not None else None)

    big_df = pd.DataFrame({"x": range(350)})
    processed = chunk_process(big_df, lambda chunk: chunk * 2) if chunk_process(big_df, lambda c: c*2) is not None else None
    print("TODO 9 — Chunk processed sum:", processed["x"].sum() if processed is not None else None)

    schema = {"id": "int64", "age": "int64", "score": "float64"}
    errors = validate_schema(df_typed, schema) if df_typed is not None else None
    print("TODO 10 — Schema errors:", errors)

    tracker = DataLineageTracker()
    if tracker is not None and hasattr(tracker, 'add_step'):
        tracker.add_step("extract", "Loaded CSV")
        tracker.add_step("transform", "Cleaned columns and cast types")
        print("TODO 11 — Lineage:", tracker.get_lineage())

    df_idem = pd.DataFrame({"value": [10.0, 20.0, 30.0, 40.0, 50.0]})
    result1 = idempotent_normalize(df_idem)
    result2 = idempotent_normalize(result1) if result1 is not None else None
    print("TODO 12 — Idempotent (once):", result1["value"].tolist() if result1 is not None else None)
    print("           Idempotent (twice):", result2["value"].tolist() if result2 is not None else None)

    features_df = pd.DataFrame({"f1": [1.0,2.0,3.0], "f2": [4.0,5.0,6.0]})
    tmp_features = os.path.join(tempfile.gettempdir(), "features.parquet")
    loaded = feature_store_save_load(features_df, tmp_features)
    print("TODO 13 — Feature store shape:", loaded.shape if loaded is not None else None)

    h = hash_dataframe(features_df)
    print("TODO 14 — Data hash:", h)

    etl = ETLPipeline(dtype_map={"age":"int64","score":"float64"})
    if etl is not None and hasattr(etl, 'run'):
        tmp_etl = os.path.join(tempfile.gettempdir(), "etl_output.parquet")
        result = etl.run(csv_data, tmp_etl)
        print("TODO 15 — ETL output shape:", result.shape if result is not None else None)


if __name__ == "__main__":
    main()
