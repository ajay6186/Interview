# ============================================================
# Examples 2.5 — Data Pipelines (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
import hashlib
import io
import os
import re
import tempfile
from datetime import datetime, timezone
from typing import Dict, List

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Read CSV from a string"""
    csv = "id,name,score\n1,Alice,90\n2,Bob,85"
    df = pd.read_csv(io.StringIO(csv))
    print("Ex01 —", df.shape, list(df.columns))

def ex02():
    """Read CSV with custom separator"""
    csv = "id|name|score\n1|Alice|90\n2|Bob|85"
    df = pd.read_csv(io.StringIO(csv), sep="|")
    print("Ex02 —", list(df.columns))

def ex03():
    """Inspect DataFrame shape and dtypes"""
    df = pd.DataFrame({"x": [1, 2, 3], "y": [1.0, 2.0, 3.0], "z": ["a", "b", "c"]})
    print("Ex03 — shape:", df.shape, "dtypes:", df.dtypes.to_dict())

def ex04():
    """Rename columns to snake_case"""
    df = pd.DataFrame({"First Name": [1], "Last  Name": [2], "Age!": [3]})
    df.columns = [re.sub(r"[^a-z0-9_]", "", c.strip().lower().replace(" ", "_"))
                  for c in df.columns]
    print("Ex04 —", list(df.columns))

def ex05():
    """Cast column dtypes"""
    df = pd.DataFrame({"age": ["25", "30", "22"], "score": ["88.5", "91.0", "76.3"]})
    df["age"] = df["age"].astype(int)
    df["score"] = df["score"].astype(float)
    print("Ex05 —", df.dtypes.to_dict())

def ex06():
    """Filter rows with query string"""
    df = pd.DataFrame({"age": [25, 30, 22, 35], "score": [88, 91, 76, 95]})
    filtered = df.query("age > 24 and score > 85")
    print("Ex06 —", len(filtered), "rows")

def ex07():
    """Drop rows with missing values"""
    df = pd.DataFrame({"a": [1, None, 3], "b": [4, 5, None]})
    cleaned = df.dropna().reset_index(drop=True)
    print("Ex07 — rows after dropna:", len(cleaned))

def ex08():
    """Remove duplicate rows"""
    df = pd.DataFrame({"id": [1, 2, 2, 3], "val": [10, 20, 20, 30]})
    deduped = df.drop_duplicates().reset_index(drop=True)
    print("Ex08 — rows after dedup:", len(deduped))

def ex09():
    """Aggregate: groupby + mean"""
    df = pd.DataFrame({"cat": ["A", "B", "A", "B"], "val": [10, 20, 30, 40]})
    agg = df.groupby("cat")["val"].mean().reset_index()
    print("Ex09 —\n", agg.to_string())

def ex10():
    """Merge two DataFrames on a key"""
    left  = pd.DataFrame({"id": [1, 2, 3], "name": ["Alice", "Bob", "Charlie"]})
    right = pd.DataFrame({"id": [1, 2, 4], "score": [90, 85, 78]})
    merged = pd.merge(left, right, on="id", how="inner")
    print("Ex10 — merged shape:", merged.shape)

def ex11():
    """Pivot table: sum of sales by date and category"""
    df = pd.DataFrame({
        "date": ["Jan", "Jan", "Feb", "Feb"],
        "cat":  ["A",   "B",   "A",   "B"],
        "sales":[100,   200,   150,   250],
    })
    piv = df.pivot_table(index="date", columns="cat", values="sales", aggfunc="sum")
    print("Ex11 —\n", piv.to_string())

def ex12():
    """Melt wide DataFrame to long format"""
    df = pd.DataFrame({"id": [1, 2], "q1": [10, 20], "q2": [30, 40]})
    melted = pd.melt(df, id_vars=["id"], value_vars=["q1", "q2"])
    print("Ex12 —\n", melted.to_string())

def ex13():
    """Hash a DataFrame for reproducibility checks"""
    df = pd.DataFrame({"a": [1, 2, 3], "b": [4.0, 5.0, 6.0]})
    h1 = hashlib.md5(df.to_csv(index=False).encode()).hexdigest()
    h2 = hashlib.md5(df.to_csv(index=False).encode()).hexdigest()
    print("Ex13 — same hash:", h1 == h2, "| hash[:8]:", h1[:8])

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Filter rows using a callable (lambda)"""
    df = pd.DataFrame({"age": [25, 30, 22, 35], "score": [88, 91, 76, 95]})
    filtered = df[df.apply(lambda row: row["age"] > 24 and row["score"] > 85, axis=1)]
    print("Ex14 —", len(filtered), "rows pass filter")

def ex15():
    """Validate schema: expected dtypes vs actual"""
    df = pd.DataFrame({"id": pd.array([1, 2], dtype="int64"),
                        "score": pd.array([1.0, 2.0], dtype="float64")})
    schema = {"id": "int64", "score": "float64", "missing_col": "object"}
    errors = []
    for col, exp in schema.items():
        if col not in df.columns:
            errors.append(f"Missing column: {col}")
        elif str(df[col].dtype) != exp:
            errors.append(f"'{col}': expected {exp}, got {df[col].dtype}")
    print("Ex15 — errors:", errors)

def ex16():
    """Multi-key aggregation"""
    df = pd.DataFrame({
        "region": ["N","N","S","S"],
        "cat":    ["A","B","A","B"],
        "sales":  [100,200,150,250],
    })
    agg = df.groupby(["region", "cat"]).agg({"sales": ["sum", "mean"]}).reset_index()
    print("Ex16 —\n", agg.to_string())

def ex17():
    """Left join preserving all left rows"""
    left  = pd.DataFrame({"id": [1, 2, 3, 4], "name": ["A","B","C","D"]})
    right = pd.DataFrame({"id": [1, 2],        "rank": ["gold","silver"]})
    merged = pd.merge(left, right, on="id", how="left")
    print("Ex17 — NaNs in rank:", merged["rank"].isna().sum())

def ex18():
    """Fill missing values with column mean"""
    df = pd.DataFrame({"score": [85.0, None, 92.0, None, 78.0]})
    df["score"] = df["score"].fillna(df["score"].mean())
    print("Ex18 — no NaNs:", df["score"].isna().sum() == 0,
          "| filled value:", round(df.iloc[1]["score"], 2))

def ex19():
    """Min-max normalize a column (idempotent)"""
    df = pd.DataFrame({"val": [10.0, 20.0, 30.0, 40.0, 50.0]})
    col_min, col_max = df["val"].min(), df["val"].max()
    df["val"] = (df["val"] - col_min) / (col_max - col_min)
    r2 = df.copy()
    r2["val"] = (r2["val"] - r2["val"].min()) / (r2["val"].max() - r2["val"].min() + 1e-10)
    print("Ex19 — first pass:", df["val"].tolist())
    print("       second pass (idempotent):", [round(v, 4) for v in r2["val"].tolist()])

def ex20():
    """Chunk-process a large DataFrame"""
    df = pd.DataFrame({"x": range(250)})
    chunks = [df.iloc[i:i + 100] for i in range(0, len(df), 100)]
    result = pd.concat([chunk * 2 for chunk in chunks], ignore_index=True)
    print("Ex20 — total rows:", len(result), "| sum:", result["x"].sum())

def ex21():
    """Save and reload a DataFrame as Parquet"""
    df = pd.DataFrame({"f1": [1.0, 2.0], "f2": [3.0, 4.0]})
    tmp = os.path.join(tempfile.gettempdir(), "ex21.parquet")
    df.to_parquet(tmp, index=False)
    loaded = pd.read_parquet(tmp)
    print("Ex21 — roundtrip equal:", df.equals(loaded))

def ex22():
    """Detect outliers via IQR"""
    df = pd.DataFrame({"val": [10, 12, 11, 13, 100, 9, 11, 12]})
    q1, q3 = df["val"].quantile(0.25), df["val"].quantile(0.75)
    iqr = q3 - q1
    outliers = df[(df["val"] < q1 - 1.5 * iqr) | (df["val"] > q3 + 1.5 * iqr)]
    print("Ex22 — outliers:", outliers["val"].tolist())

def ex23():
    """Convert wide date columns to datetime index"""
    df = pd.DataFrame({"date": ["2024-01-01", "2024-02-01"], "val": [10, 20]})
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date")
    print("Ex23 — index type:", type(df.index).__name__, "| shape:", df.shape)

def ex24():
    """String feature: extract numeric part"""
    df = pd.DataFrame({"price": ["$12.50", "$7.99", "$45.00"]})
    df["amount"] = df["price"].str.replace("$", "", regex=False).astype(float)
    print("Ex24 —", df["amount"].tolist())

def ex25():
    """One-hot encode a categorical column"""
    df = pd.DataFrame({"color": ["red", "blue", "red", "green"]})
    encoded = pd.get_dummies(df["color"], prefix="color")
    print("Ex25 — OHE columns:", list(encoded.columns))

def ex26():
    """Compute rolling 3-period mean"""
    df = pd.DataFrame({"val": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0]})
    df["rolling_mean"] = df["val"].rolling(window=3).mean()
    print("Ex26 —", df["rolling_mean"].tolist())

# ─── NESTED (27–38) ────────────────────────────────────────

def ex27():
    """DataLineageTracker: log pipeline steps"""
    class DataLineageTracker:
        def __init__(self):
            self._steps: List[Dict] = []
        def add_step(self, name: str, desc: str, **meta):
            self._steps.append({"step": name, "desc": desc,
                                  "ts": datetime.now(timezone.utc).isoformat(), **meta})
        def get_lineage(self):
            return list(self._steps)
    tracker = DataLineageTracker()
    tracker.add_step("extract", "Loaded CSV", rows=100)
    tracker.add_step("transform", "Cleaned columns")
    tracker.add_step("load", "Saved parquet", path="/tmp/out.parquet")
    print("Ex27 — steps:", len(tracker.get_lineage()),
          "| names:", [s["step"] for s in tracker.get_lineage()])

def ex28():
    """ETLPipeline class: extract → transform → load"""
    class ETLPipeline:
        def __init__(self):
            self.log = []
        def extract(self, csv_str):
            df = pd.read_csv(io.StringIO(csv_str))
            self.log.append(f"extract: {df.shape}")
            return df
        def transform(self, df):
            df = df.copy()
            df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
            df = df.dropna().drop_duplicates().reset_index(drop=True)
            self.log.append(f"transform: {df.shape}")
            return df
        def load(self, df, path):
            df.to_parquet(path, index=False)
            self.log.append(f"load: {path}")
    csv = "id, Name ,score\n1,Alice,90\n2,Bob,85\n2,Bob,85"
    pipe = ETLPipeline()
    df = pipe.extract(csv)
    df = pipe.transform(df)
    pipe.load(df, os.path.join(tempfile.gettempdir(), "ex28_etl.parquet"))
    print("Ex28 — log:", pipe.log)

def ex29():
    """Nested pipeline: multi-table merge → aggregate → pivot"""
    orders = pd.DataFrame({"order_id": [1,2,3,4],
                            "user_id": [1,1,2,2],
                            "product": ["A","B","A","B"],
                            "amount": [100, 200, 150, 250]})
    users = pd.DataFrame({"user_id": [1, 2], "region": ["N", "S"]})
    merged = pd.merge(orders, users, on="user_id")
    agg = merged.groupby(["region", "product"])["amount"].sum().reset_index()
    piv = agg.pivot_table(index="region", columns="product", values="amount", aggfunc="sum")
    print("Ex29 — pivot:\n", piv.to_string())

def ex30():
    """Feature engineering inside a pipeline step"""
    df = pd.DataFrame({"first_name": ["Alice", "Bob"], "last_name": ["Smith", "Jones"],
                        "birth_year": [1990, 1985]})
    df["full_name"] = df["first_name"] + " " + df["last_name"]
    df["age"] = 2024 - df["birth_year"]
    df = df.drop(columns=["first_name", "last_name", "birth_year"])
    print("Ex30 —\n", df.to_string())

def ex31():
    """Incremental load: append new data, deduplicate"""
    existing = pd.DataFrame({"id": [1, 2, 3], "val": [10, 20, 30]})
    new_data  = pd.DataFrame({"id": [3, 4, 5], "val": [30, 40, 50]})
    combined  = pd.concat([existing, new_data], ignore_index=True).drop_duplicates(subset=["id"])
    print("Ex31 — combined rows:", len(combined), "| ids:", combined["id"].tolist())

def ex32():
    """Schema drift detection: new columns in incoming data"""
    expected_cols = {"id", "name", "score"}
    incoming = pd.DataFrame({"id": [1], "name": ["Alice"], "score": [90], "bonus": [5]})
    new_cols = set(incoming.columns) - expected_cols
    missing  = expected_cols - set(incoming.columns)
    print("Ex32 — new cols:", new_cols, "| missing cols:", missing)

def ex33():
    """Type coercion pipeline with error reporting"""
    def safe_cast(df, col, dtype):
        errors = []
        result = df.copy()
        try:
            result[col] = result[col].astype(dtype)
        except Exception as e:
            errors.append(str(e))
        return result, errors
    df = pd.DataFrame({"age": ["25", "30", "bad", "22"]})
    df["age_num"] = pd.to_numeric(df["age"], errors="coerce")
    bad = df["age_num"].isna().sum()
    print("Ex33 — bad values:", bad, "| converted:\n", df.to_string())

def ex34():
    """Parameterized aggregation function"""
    def aggregate(df, group_col, agg_dict):
        return df.groupby(group_col).agg(agg_dict).reset_index()
    df = pd.DataFrame({"cat": ["A","B","A","B","A"],
                        "score": [80, 90, 85, 95, 70],
                        "clicks": [10, 20, 15, 25, 5]})
    result = aggregate(df, "cat", {"score": ["mean", "max"], "clicks": "sum"})
    print("Ex34 —\n", result.to_string())

def ex35():
    """Resampling time series data to monthly frequency"""
    dates = pd.date_range("2024-01-01", periods=90, freq="D")
    df = pd.DataFrame({"date": dates, "val": np.random.RandomState(0).randn(90)})
    df = df.set_index("date")
    monthly = df.resample("ME").mean()
    print("Ex35 — monthly shape:", monthly.shape, "| months:", monthly.index.strftime("%b").tolist())

def ex36():
    """Data quality score: completeness + uniqueness"""
    df = pd.DataFrame({"id": [1,2,2,4,None],
                        "val": [10, None, 20, 30, 40]})
    completeness = 1 - df.isna().sum().sum() / df.size
    uniqueness_id = df["id"].dropna().nunique() / len(df)
    print(f"Ex36 — completeness={completeness:.2f}, id uniqueness={uniqueness_id:.2f}")

def ex37():
    """Explode list-valued column to rows"""
    df = pd.DataFrame({"user": [1, 2], "tags": [["ml","ai"], ["data","ml","python"]]})
    exploded = df.explode("tags").reset_index(drop=True)
    print("Ex37 —\n", exploded.to_string())

def ex38():
    """Build feature store: save, version, reload"""
    features = pd.DataFrame({"user_id": [1,2,3], "f1": [0.1,0.2,0.3], "f2": [1.0,2.0,3.0]})
    tmp = os.path.join(tempfile.gettempdir(), "feature_store_v1.parquet")
    features.to_parquet(tmp, index=False)
    loaded = pd.read_parquet(tmp)
    h = hashlib.md5(features.to_csv(index=False).encode()).hexdigest()
    print("Ex38 — saved & loaded:", features.equals(loaded), "| hash[:8]:", h[:8])

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Full ETL with lineage, validation, and idempotency"""
    class FullETL:
        def __init__(self):
            self.lineage = []
        def run(self, csv_str, output_path):
            df = pd.read_csv(io.StringIO(csv_str))
            self.lineage.append(f"extract: {df.shape}")
            df.columns = [re.sub(r"[^a-z0-9_]", "", c.strip().lower().replace(" ", "_"))
                           for c in df.columns]
            df = df.dropna().drop_duplicates().reset_index(drop=True)
            self.lineage.append(f"transform: {df.shape}")
            # Validate
            errors = []
            for col in df.columns:
                if df[col].isna().all():
                    errors.append(f"All-NaN: {col}")
            if errors:
                self.lineage.append(f"validation_errors: {errors}")
            df.to_parquet(output_path, index=False)
            self.lineage.append(f"load: {output_path}")
            return df
    csv = "id, Name, score\n1,Alice,90\n2,Bob,85\n2,Bob,85\n3,Carol,78"
    etl = FullETL()
    result = etl.run(csv, os.path.join(tempfile.gettempdir(), "ex39.parquet"))
    print("Ex39 — result shape:", result.shape, "| lineage:", etl.lineage)

def ex40():
    """Stream-friendly chunk pipeline with per-chunk stats"""
    np.random.seed(0)
    df = pd.DataFrame({"x": np.random.randn(500), "y": np.random.randint(0, 3, 500)})
    stats = []
    for i in range(0, len(df), 100):
        chunk = df.iloc[i:i+100]
        stats.append({"chunk": i//100, "mean_x": round(chunk["x"].mean(), 4),
                       "rows": len(chunk)})
    total_rows = sum(s["rows"] for s in stats)
    print("Ex40 — chunks:", len(stats), "| total rows:", total_rows,
          "| mean_x chunk0:", stats[0]["mean_x"])

def ex41():
    """Slowly changing dimension (SCD Type 2) simulation"""
    history = pd.DataFrame({
        "id": [1, 1, 2],
        "val": [10, 20, 30],
        "valid_from": pd.to_datetime(["2023-01-01", "2023-06-01", "2023-01-01"]),
        "valid_to":   pd.to_datetime(["2023-05-31", "9999-12-31", "9999-12-31"]),
        "is_current": [False, True, True],
    })
    current = history[history["is_current"]].reset_index(drop=True)
    print("Ex41 — current records:\n", current[["id","val","valid_from"]].to_string())

def ex42():
    """Cross-join + filter: candidate generation"""
    users  = pd.DataFrame({"user_id": [1, 2]})
    items  = pd.DataFrame({"item_id": [10, 11, 12]})
    pairs  = users.merge(items, how="cross")
    interacted = {(1, 10), (2, 11)}
    candidates = pairs[~pairs.apply(lambda r: (r["user_id"], r["item_id"]) in interacted, axis=1)]
    print("Ex42 — candidate pairs:", len(candidates))

def ex43():
    """Parameterized pipeline factory"""
    def make_pipeline(drop_nulls=True, normalize=True):
        steps = []
        if drop_nulls:
            steps.append("drop_nulls")
        if normalize:
            steps.append("normalize")
        def run(df, col="val"):
            df = df.copy()
            if "drop_nulls" in steps:
                df = df.dropna()
            if "normalize" in steps and col in df.columns:
                mn, mx = df[col].min(), df[col].max()
                df[col] = (df[col] - mn) / (mx - mn + 1e-10)
            return df
        return run
    df = pd.DataFrame({"val": [10.0, None, 30.0, 40.0, 50.0]})
    pipe = make_pipeline(drop_nulls=True, normalize=True)
    result = pipe(df)
    print("Ex43 — rows:", len(result), "| min:", result["val"].min(), "| max:", round(result["val"].max(), 4))

def ex44():
    """Multi-source join pipeline: three tables"""
    orders   = pd.DataFrame({"order_id":[1,2,3], "user_id":[1,2,1], "item_id":[10,11,12]})
    users    = pd.DataFrame({"user_id":[1,2], "region":["N","S"]})
    items    = pd.DataFrame({"item_id":[10,11,12], "price":[5.99,12.99,3.49]})
    combined = orders.merge(users, on="user_id").merge(items, on="item_id")
    revenue  = combined.groupby("region")["price"].sum().reset_index()
    print("Ex44 — revenue by region:\n", revenue.to_string())

def ex45():
    """Data versioning via content hash comparison"""
    df_v1 = pd.DataFrame({"id": [1,2,3], "val": [10,20,30]})
    df_v2 = pd.DataFrame({"id": [1,2,3], "val": [10,20,35]})
    def hash_df(df):
        return hashlib.md5(df.to_csv(index=False).encode()).hexdigest()
    h1, h2 = hash_df(df_v1), hash_df(df_v2)
    print("Ex45 — v1 hash:", h1[:8], "| v2 hash:", h2[:8], "| changed:", h1 != h2)

def ex46():
    """Automated data profile report"""
    def profile(df):
        report = {}
        for col in df.columns:
            report[col] = {
                "dtype": str(df[col].dtype),
                "nulls": int(df[col].isna().sum()),
                "unique": int(df[col].nunique()),
                "mean": round(float(df[col].mean()), 4) if pd.api.types.is_numeric_dtype(df[col]) else None,
            }
        return report
    df = pd.DataFrame({"age": [25, 30, None, 22], "city": ["NY","LA","NY","NY"]})
    rpt = profile(df)
    print("Ex46 — age profile:", rpt["age"])
    print("       city profile:", rpt["city"])

def ex47():
    """Delta load: only insert new records by comparing hashes"""
    existing_ids = {1, 2, 3}
    incoming = pd.DataFrame({"id": [2, 3, 4, 5], "val": [20, 30, 40, 50]})
    new_records = incoming[~incoming["id"].isin(existing_ids)].reset_index(drop=True)
    print("Ex47 — new records to insert:", len(new_records),
          "| ids:", new_records["id"].tolist())

def ex48():
    """Parallel chunk processing simulation (sequential but structured)"""
    def process_chunk(chunk_id, chunk):
        return {"chunk_id": chunk_id, "sum": chunk["val"].sum(), "n": len(chunk)}
    df = pd.DataFrame({"val": range(1000)})
    chunk_size = 250
    results = [process_chunk(i, df.iloc[i*chunk_size:(i+1)*chunk_size])
               for i in range(len(df) // chunk_size)]
    total = sum(r["sum"] for r in results)
    print("Ex48 — chunks:", len(results), "| total sum:", total)

def ex49():
    """Pipeline monitoring: log row counts at each step"""
    class MonitoredPipeline:
        def __init__(self):
            self.metrics = {}
        def step(self, name, df):
            self.metrics[name] = len(df)
            return df
    df = pd.DataFrame({"id": range(100), "val": np.random.randn(100)})
    df.iloc[5:10, 1] = np.nan
    pipe = MonitoredPipeline()
    df = pipe.step("raw", df)
    df = pipe.step("after_dropna", df.dropna())
    df = pipe.step("after_filter", df[df["val"] > 0])
    print("Ex49 — row counts:", pipe.metrics)

def ex50():
    """End-to-end reproducible pipeline with seed and hash verification"""
    def build_dataset(seed=42):
        rng = np.random.RandomState(seed)
        n = 200
        df = pd.DataFrame({
            "feature_1": rng.randn(n),
            "feature_2": rng.randint(0, 5, n).astype(float),
            "label":     (rng.randn(n) > 0).astype(int),
        })
        df["feature_1"] = (df["feature_1"] - df["feature_1"].mean()) / df["feature_1"].std()
        return df
    df1 = build_dataset(seed=42)
    df2 = build_dataset(seed=42)
    h1  = hashlib.md5(df1.to_csv(index=False).encode()).hexdigest()
    h2  = hashlib.md5(df2.to_csv(index=False).encode()).hexdigest()
    print("Ex50 — reproducible:", h1 == h2, "| shape:", df1.shape,
          "| label mean:", round(df1["label"].mean(), 4))


def main():
    print("=" * 60)
    print("Examples 2.5 — Data Pipelines")
    print("=" * 60)
    print("\n--- BASIC (1-13) ---")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()
    print("\n--- INTERMEDIATE (14-26) ---")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()
    print("\n--- NESTED (27-38) ---")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()
    print("\n--- ADVANCED (39-50) ---")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
