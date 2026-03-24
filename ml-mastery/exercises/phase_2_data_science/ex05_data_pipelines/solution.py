# ============================================================
# Solution 2.5 — Data Pipelines
# ============================================================

import numpy as np
import pandas as pd
import hashlib
import os
import io
import re
import tempfile
from datetime import datetime, timezone
from typing import Dict, List, Any


def read_csv_data(source: str) -> pd.DataFrame:
    # Try as a file path first
    if os.path.exists(source):
        return pd.read_csv(source)
    # Fall back to treating as CSV string
    return pd.read_csv(io.StringIO(source))


def clean_column_names(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    cleaned = []
    for col in df.columns:
        c = str(col).strip().lower()
        c = c.replace(" ", "_")
        c = re.sub(r"[^a-z0-9_]", "", c)
        cleaned.append(c)
    df.columns = cleaned
    return df


def cast_dtypes(df: pd.DataFrame, dtype_map: Dict[str, str]) -> pd.DataFrame:
    df = df.copy()
    for col, dtype in dtype_map.items():
        if col in df.columns:
            try:
                df[col] = df[col].astype(dtype)
            except (ValueError, TypeError) as e:
                print(f"Warning: could not cast '{col}' to {dtype}: {e}")
    return df


def filter_rows(df: pd.DataFrame, condition) -> pd.DataFrame:
    if isinstance(condition, str):
        return df.query(condition).reset_index(drop=True)
    elif callable(condition):
        mask = df.apply(condition, axis=1)
        return df[mask].reset_index(drop=True)
    else:
        raise ValueError("condition must be a query string or callable")


def aggregate(df: pd.DataFrame, group_col: str, agg_dict: Dict) -> pd.DataFrame:
    return df.groupby(group_col).agg(agg_dict).reset_index()


def merge_dfs(df_left: pd.DataFrame, df_right: pd.DataFrame,
              on: str, how: str = "inner") -> pd.DataFrame:
    return pd.merge(df_left, df_right, on=on, how=how)


def pivot_table(df: pd.DataFrame, index_col: str, columns_col: str,
                values_col: str, aggfunc: str = "mean") -> pd.DataFrame:
    return df.pivot_table(
        index=index_col,
        columns=columns_col,
        values=values_col,
        aggfunc=aggfunc,
    )


def melt_df(df: pd.DataFrame, id_vars: List[str], value_vars: List[str]) -> pd.DataFrame:
    return pd.melt(df, id_vars=id_vars, value_vars=value_vars)


def chunk_process(df: pd.DataFrame, transform_fn, chunk_size: int = 100) -> pd.DataFrame:
    chunks = [df.iloc[i:i + chunk_size] for i in range(0, len(df), chunk_size)]
    processed = [transform_fn(chunk) for chunk in chunks]
    return pd.concat(processed, ignore_index=True)


def validate_schema(df: pd.DataFrame, schema: Dict[str, str]) -> List[str]:
    errors = []
    for col, expected_dtype in schema.items():
        if col not in df.columns:
            errors.append(f"Missing column: '{col}'")
            continue
        actual_dtype = str(df[col].dtype)
        if actual_dtype != expected_dtype:
            errors.append(f"'{col}': expected {expected_dtype}, got {actual_dtype}")
    return errors


class DataLineageTracker:
    def __init__(self):
        self._steps: List[Dict] = []

    def add_step(self, step_name: str, description: str, **metadata):
        self._steps.append({
            "step_name":   step_name,
            "description": description,
            "timestamp":   datetime.now(timezone.utc).isoformat(),
            **metadata,
        })

    def get_lineage(self) -> List[Dict]:
        return list(self._steps)

    def __repr__(self) -> str:
        lines = [f"DataLineageTracker ({len(self._steps)} steps):"]
        for i, step in enumerate(self._steps, 1):
            lines.append(f"  {i}. [{step['step_name']}] {step['description']}")
        return "\n".join(lines)


def idempotent_normalize(df: pd.DataFrame, col: str = "value") -> pd.DataFrame:
    df = df.copy()
    col_min = df[col].min()
    col_max = df[col].max()
    if col_max == col_min:
        # Already constant, return zeros
        df[col] = 0.0
    else:
        df[col] = (df[col] - col_min) / (col_max - col_min)
    return df


def feature_store_save_load(df: pd.DataFrame, filepath: str) -> pd.DataFrame:
    df.to_parquet(filepath, index=False)
    return pd.read_parquet(filepath)


def hash_dataframe(df: pd.DataFrame) -> str:
    csv_str = df.to_csv(index=False)
    return hashlib.md5(csv_str.encode()).hexdigest()


class ETLPipeline:
    def __init__(self, dtype_map: Dict = None, drop_nulls: bool = True):
        self.dtype_map = dtype_map or {}
        self.drop_nulls = drop_nulls
        self.lineage = DataLineageTracker()

    def extract(self, source: str) -> pd.DataFrame:
        df = read_csv_data(source)
        self.lineage.add_step("extract", f"Loaded data: shape={df.shape}")
        return df

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = clean_column_names(df)
        self.lineage.add_step("clean_columns", "Standardized column names")

        if self.drop_nulls:
            n_before = len(df)
            df = df.dropna().reset_index(drop=True)
            dropped = n_before - len(df)
            self.lineage.add_step("drop_nulls", f"Dropped {dropped} rows with nulls")

        # Remove duplicates
        n_before = len(df)
        df = df.drop_duplicates().reset_index(drop=True)
        dropped = n_before - len(df)
        self.lineage.add_step("dedup", f"Removed {dropped} duplicate rows")

        if self.dtype_map:
            df = cast_dtypes(df, self.dtype_map)
            self.lineage.add_step("cast_dtypes", f"Cast columns: {list(self.dtype_map.keys())}")

        return df

    def load(self, df: pd.DataFrame, filepath: str) -> None:
        df.to_parquet(filepath, index=False)
        self.lineage.add_step("load", f"Saved to {filepath}: shape={df.shape}")

    def run(self, source: str, output_path: str) -> pd.DataFrame:
        df = self.extract(source)
        df = self.transform(df)
        self.load(df, output_path)
        print(self.lineage)
        return df


def main():
    print("=== Solution 2.5: Data Pipelines ===\n")

    csv_data = """id, First Name ,age,score,category
1,Alice,30,85.5,A
2,Bob,25,92.0,B
3,Charlie,35,78.3,A
4,Diana,28,95.1,B
5,Eve,22,88.7,A
1,Alice,30,85.5,A"""

    df = read_csv_data(csv_data)
    print("Result 1 — Read CSV shape:", df.shape)
    print("           Columns:", list(df.columns))

    df_clean = clean_column_names(df)
    print("Result 2 — Cleaned columns:", list(df_clean.columns))

    df_typed = cast_dtypes(df_clean, {"age": "int64", "score": "float64"})
    print("Result 3 — Dtypes:\n", df_typed.dtypes.to_string())

    df_filtered = filter_rows(df_typed, "age > 25")
    print("Result 4 — Rows with age > 25:", len(df_filtered))

    agg = aggregate(df_typed, "category", {"score": ["mean", "min", "max"]})
    print("Result 5 — Aggregation:\n", agg.to_string())

    df_right = pd.DataFrame({"id": [1, 2, 3], "rank": ["gold", "silver", "bronze"]})
    merged = merge_dfs(df_typed, df_right, on="id")
    print("Result 6 — Merged shape:", merged.shape)
    print("           Merged:\n", merged.to_string())

    sales_df = pd.DataFrame({
        "date":     ["2024-01", "2024-01", "2024-02", "2024-02"],
        "category": ["A", "B", "A", "B"],
        "sales":    [100, 200, 150, 250],
    })
    piv = pivot_table(sales_df, "date", "category", "sales", "sum")
    print("Result 7 — Pivot table:\n", piv.to_string())

    wide_df = pd.DataFrame({"id": [1, 2], "q1": [10, 20], "q2": [30, 40], "q3": [50, 60]})
    melted = melt_df(wide_df, id_vars=["id"], value_vars=["q1","q2","q3"])
    print("Result 8 — Melted:\n", melted.to_string())

    big_df = pd.DataFrame({"x": range(350)})
    processed = chunk_process(big_df, lambda chunk: chunk * 2)
    print("Result 9 — Chunk processed sum:", processed["x"].sum(), "(expect:", sum(range(350))*2, ")")

    schema = {"id": "int64", "age": "int64", "score": "float64"}
    errors = validate_schema(df_typed, schema)
    print("Result 10 — Schema errors:", errors if errors else "None — schema valid")

    tracker = DataLineageTracker()
    tracker.add_step("extract", "Loaded CSV from string")
    tracker.add_step("transform", "Cleaned columns and cast types", rows_in=6, rows_out=5)
    tracker.add_step("load", "Saved to parquet")
    print("Result 11 — Lineage:\n", tracker)

    df_idem = pd.DataFrame({"value": [10.0, 20.0, 30.0, 40.0, 50.0]})
    r1 = idempotent_normalize(df_idem)
    r2 = idempotent_normalize(r1)
    print("Result 12 — Once:", r1["value"].tolist())
    print("           Twice:", r2["value"].tolist())
    print("           Equal:", np.allclose(r1["value"], r2["value"]))

    features_df = pd.DataFrame({"f1": [1.0, 2.0, 3.0], "f2": [4.0, 5.0, 6.0]})
    tmp_features = os.path.join(tempfile.gettempdir(), "features.parquet")
    loaded = feature_store_save_load(features_df, tmp_features)
    print("Result 13 — Feature store:", loaded.to_string())

    h = hash_dataframe(features_df)
    h2 = hash_dataframe(features_df)
    print(f"Result 14 — Hash: {h}")
    print(f"           Same hash? {h == h2}")

    etl = ETLPipeline(dtype_map={"age": "int64", "score": "float64"})
    tmp_etl = os.path.join(tempfile.gettempdir(), "etl_output.parquet")
    result = etl.run(csv_data, tmp_etl)
    print("Result 15 — ETL output:\n", result.to_string())


if __name__ == "__main__":
    main()
