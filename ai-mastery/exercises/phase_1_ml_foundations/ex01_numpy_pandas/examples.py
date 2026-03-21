# ============================================================
# Examples 1.1 — NumPy & Pandas Basics (50 examples)
# BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
# ============================================================

import numpy as np
import pandas as pd
import io

# ─── BASIC (1–13) ───────────────────────────────────────────

def ex01():
    """Array from list"""
    arr = np.array([1, 2, 3, 4, 5])
    print("Ex01 — Array from list:", arr)

def ex02():
    """zeros / ones / full"""
    z = np.zeros(4)
    o = np.ones((2, 3))
    f = np.full((2, 2), 7)
    print("Ex02 — zeros:", z, "| ones shape:", o.shape, "| full:\n", f)

def ex03():
    """arange"""
    arr = np.arange(0, 20, 3)
    print("Ex03 — arange:", arr)

def ex04():
    """linspace"""
    arr = np.linspace(0, 1, 6)
    print("Ex04 — linspace:", arr)

def ex05():
    """Random array"""
    rng = np.random.default_rng(42)
    arr = rng.random((2, 4))
    print("Ex05 — random array:\n", arr)

def ex06():
    """Reshape"""
    arr = np.arange(12).reshape(3, 4)
    print("Ex06 — reshape to (3,4):\n", arr)

def ex07():
    """Array indexing"""
    arr = np.arange(10)
    print("Ex07 — index [2], slice [3:7]:", arr[2], arr[3:7])

def ex08():
    """Boolean mask"""
    arr = np.array([5, 12, 3, 18, 7])
    mask = arr > 8
    print("Ex08 — boolean mask (>8):", arr[mask])

def ex09():
    """Array math"""
    a = np.array([1, 2, 3])
    b = np.array([4, 5, 6])
    print("Ex09 — add:", a + b, "| mul:", a * b, "| power:", a ** 2)

def ex10():
    """Dot product"""
    a = np.array([1, 2, 3])
    b = np.array([4, 5, 6])
    result = np.dot(a, b)
    print("Ex10 — dot product:", result)

def ex11():
    """DataFrame from dict"""
    df = pd.DataFrame({"name": ["Alice", "Bob", "Carol"], "age": [25, 30, 22], "score": [88.5, 92.0, 79.3]})
    print("Ex11 — DataFrame:\n", df)

def ex12():
    """DataFrame indexing"""
    df = pd.DataFrame({"x": [10, 20, 30], "y": [1, 2, 3]})
    print("Ex12 — column:", df["x"].values, "| iloc row 1:", df.iloc[1].values)

def ex13():
    """Read CSV from string"""
    csv = "a,b,c\n1,2,3\n4,5,6\n7,8,9"
    df = pd.read_csv(io.StringIO(csv))
    print("Ex13 — read CSV:\n", df)

# ─── INTERMEDIATE (14–26) ───────────────────────────────────

def ex14():
    """Stacking arrays (vstack / hstack)"""
    a = np.array([[1, 2], [3, 4]])
    b = np.array([[5, 6], [7, 8]])
    print("Ex14 — vstack:\n", np.vstack([a, b]))
    print("       hstack:\n", np.hstack([a, b]))

def ex15():
    """Broadcasting"""
    mat = np.ones((3, 4))
    row = np.array([1, 2, 3, 4])
    result = mat + row          # row broadcast over rows
    print("Ex15 — broadcast add (3,4)+(4,):\n", result)

def ex16():
    """Matrix multiply (@)"""
    A = np.array([[1, 2], [3, 4]])
    B = np.array([[5, 6], [7, 8]])
    print("Ex16 — matrix multiply:\n", A @ B)

def ex17():
    """Fancy indexing"""
    arr = np.arange(10) * 10
    idx = [0, 3, 7]
    print("Ex17 — fancy indexing at [0,3,7]:", arr[idx])

def ex18():
    """np.where / np.select"""
    arr = np.array([-3, -1, 0, 2, 5])
    result = np.where(arr >= 0, arr, 0)   # ReLU-like
    print("Ex18 — np.where (ReLU):", result)

def ex19():
    """cumsum / cumprod"""
    arr = np.array([1, 2, 3, 4, 5])
    print("Ex19 — cumsum:", np.cumsum(arr), "| cumprod:", np.cumprod(arr))

def ex20():
    """argsort"""
    arr = np.array([30, 10, 50, 20, 40])
    idx = np.argsort(arr)
    print("Ex20 — argsort:", idx, "| sorted:", arr[idx])

def ex21():
    """DataFrame groupby"""
    df = pd.DataFrame({"dept": ["A", "B", "A", "B", "A"], "salary": [70, 80, 65, 90, 75]})
    result = df.groupby("dept")["salary"].mean()
    print("Ex21 — groupby mean salary:\n", result)

def ex22():
    """Pivot table"""
    df = pd.DataFrame({"region": ["N", "S", "N", "S"], "product": ["X", "X", "Y", "Y"], "sales": [100, 150, 200, 130]})
    pt = df.pivot_table(values="sales", index="region", columns="product")
    print("Ex22 — pivot table:\n", pt)

def ex23():
    """Merge DataFrames"""
    left = pd.DataFrame({"id": [1, 2, 3], "name": ["Alice", "Bob", "Carol"]})
    right = pd.DataFrame({"id": [1, 2, 4], "score": [88, 92, 75]})
    merged = pd.merge(left, right, on="id", how="left")
    print("Ex23 — left merge:\n", merged)

def ex24():
    """Apply function"""
    df = pd.DataFrame({"val": [1, 4, 9, 16, 25]})
    df["sqrt"] = df["val"].apply(np.sqrt)
    print("Ex24 — apply sqrt:\n", df)

def ex25():
    """Rolling window"""
    s = pd.Series([1, 2, 3, 4, 5, 6, 7])
    print("Ex25 — rolling mean (window=3):", s.rolling(3).mean().values)

def ex26():
    """Resample time series"""
    idx = pd.date_range("2024-01-01", periods=12, freq="ME")
    s = pd.Series(range(12), index=idx)
    quarterly = s.resample("QE").sum()
    print("Ex26 — quarterly resample:\n", quarterly)

# ─── NESTED (27–38) ─────────────────────────────────────────

def ex27():
    """Pipeline: create array → reshape → compute stats"""
    def make_data():
        return np.random.default_rng(0).integers(0, 100, 24)
    def reshape_data(arr):
        return arr.reshape(4, 6)
    def compute_stats(mat):
        return {"row_means": mat.mean(axis=1), "col_stds": mat.std(axis=0)}
    stats = compute_stats(reshape_data(make_data()))
    print("Ex27 — row means:", stats["row_means"], "\n       col stds:", stats["col_stds"])

def ex28():
    """Nested groupby (multiple keys)"""
    df = pd.DataFrame({
        "year":   [2022, 2022, 2023, 2023, 2022, 2023],
        "region": ["N",  "S",  "N",  "S",  "N",  "S"],
        "sales":  [100, 200, 150, 250, 120, 210],
    })
    result = df.groupby(["year", "region"])["sales"].sum().unstack()
    print("Ex28 — nested groupby:\n", result)

def ex29():
    """Multi-index DataFrame"""
    arrays = [["cat", "cat", "dog", "dog"], ["male", "female", "male", "female"]]
    idx = pd.MultiIndex.from_arrays(arrays, names=["animal", "gender"])
    df = pd.DataFrame({"count": [10, 12, 8, 9], "weight": [4.5, 4.0, 12.0, 11.5]}, index=idx)
    print("Ex29 — multi-index:\n", df)
    print("       cross-section cat:", df.xs("cat").values)

def ex30():
    """Function on each group"""
    df = pd.DataFrame({"grp": ["A", "A", "B", "B"], "v": [10, 20, 30, 40]})
    def zscore(x):
        return (x - x.mean()) / x.std()
    df["z"] = df.groupby("grp")["v"].transform(zscore)
    print("Ex30 — within-group z-score:\n", df)

def ex31():
    """Custom aggregation"""
    df = pd.DataFrame({"g": ["X", "X", "Y", "Y", "Y"], "v": [1, 3, 2, 6, 4]})
    result = df.groupby("g")["v"].agg(["mean", "max", lambda x: x.max() - x.min()])
    result.columns = ["mean", "max", "range"]
    print("Ex31 — custom agg:\n", result)

def ex32():
    """Chained DataFrame ops"""
    df = pd.DataFrame({"name": ["alice", "bob", "carol", "dave"], "score": [55, 82, 91, 47]})
    result = (df
              .assign(grade=lambda d: pd.cut(d["score"], bins=[0,60,80,100], labels=["C","B","A"]))
              .query("score > 50")
              .sort_values("score", ascending=False)
              .reset_index(drop=True))
    print("Ex32 — chained ops:\n", result)

def ex33():
    """Data cleaning pipeline"""
    def remove_duplicates(df):
        return df.drop_duplicates()
    def fill_missing(df):
        return df.fillna(df.mean(numeric_only=True))
    def rename_cols(df):
        return df.rename(columns=str.lower)
    raw = pd.DataFrame({"A": [1, 2, None, 2], "B": [4, None, 6, 4]})
    clean = rename_cols(fill_missing(remove_duplicates(raw)))
    print("Ex33 — cleaned df:\n", clean)

def ex34():
    """Feature matrix from DataFrame"""
    df = pd.DataFrame({"age": [25, 30, 22], "income": [50000, 80000, 35000], "label": [0, 1, 0]})
    X = df.drop("label", axis=1).to_numpy()
    y = df["label"].to_numpy()
    print("Ex34 — X:\n", X, "\n       y:", y)

def ex35():
    """Cross-tabulation"""
    df = pd.DataFrame({"gender": ["M","F","M","F","M"], "purchase": ["Y","N","Y","Y","N"]})
    ct = pd.crosstab(df["gender"], df["purchase"])
    print("Ex35 — crosstab:\n", ct)

def ex36():
    """Correlation matrix"""
    rng = np.random.default_rng(1)
    df = pd.DataFrame(rng.random((6, 4)), columns=["A","B","C","D"])
    df["B"] = df["A"] * 2 + rng.random(6) * 0.1
    corr = df.corr(numeric_only=True).round(2)
    print("Ex36 — correlation matrix:\n", corr)

def ex37():
    """DataFrame to numpy and back"""
    df = pd.DataFrame({"x": [1.0, 2.0, 3.0], "y": [4.0, 5.0, 6.0]})
    arr = df.to_numpy()
    arr_scaled = arr * 10
    df2 = pd.DataFrame(arr_scaled, columns=df.columns)
    print("Ex37 — round-trip scaled:\n", df2)

def ex38():
    """Date range index"""
    idx = pd.date_range("2024-01-01", periods=8, freq="W")
    s = pd.Series(np.cumsum(np.random.default_rng(7).integers(1, 10, 8)), index=idx)
    print("Ex38 — date-indexed series:\n", s)

# ─── ADVANCED (39–50) ───────────────────────────────────────

def ex39():
    """Sparse array concept with numpy (compressed storage simulation)"""
    dense = np.array([0, 0, 3, 0, 7, 0, 0, 2])
    nonzero_idx = np.nonzero(dense)[0]
    nonzero_val = dense[nonzero_idx]
    sparsity = 1 - len(nonzero_val) / len(dense)
    print("Ex39 — sparse indices:", nonzero_idx, "| values:", nonzero_val, "| sparsity:", f"{sparsity:.1%}")

def ex40():
    """Memory-efficient chunked processing"""
    csv_data = "\n".join([f"{i},{i*2},{i**2}" for i in range(100)])
    csv_data = "a,b,c\n" + csv_data
    chunk_sums = []
    for chunk in pd.read_csv(io.StringIO(csv_data), chunksize=20):
        chunk_sums.append(chunk["a"].sum())
    print("Ex40 — chunked sum:", sum(chunk_sums), "(expected:", sum(range(100)), ")")

def ex41():
    """Vectorized string ops"""
    s = pd.Series(["  Hello World  ", "numpy PANDAS", "Machine Learning", "  AI  "])
    result = s.str.strip().str.lower().str.replace(" ", "_", regex=False)
    print("Ex41 — vectorized string ops:", result.tolist())

def ex42():
    """Advanced merge (multi-key, suffixes)"""
    df1 = pd.DataFrame({"yr": [2023,2023,2024], "mo": [1,2,1], "sales": [100,200,150]})
    df2 = pd.DataFrame({"yr": [2023,2023,2024], "mo": [1,2,1], "sales": [95,210,140]})
    m = pd.merge(df1, df2, on=["yr","mo"], suffixes=("_actual","_budget"))
    m["variance"] = m["sales_actual"] - m["sales_budget"]
    print("Ex42 — multi-key merge with variance:\n", m)

def ex43():
    """DataFrame pipe pattern"""
    def add_ratio(df, col_a, col_b, name):
        return df.assign(**{name: df[col_a] / df[col_b]})
    def clip_outliers(df, col, lo, hi):
        return df.assign(**{col: df[col].clip(lo, hi)})
    df = pd.DataFrame({"revenue": [100, 200, 5000, 150], "cost": [80, 180, 100, 120]})
    result = (df
              .pipe(clip_outliers, "revenue", 0, 500)
              .pipe(add_ratio, "revenue", "cost", "margin_ratio"))
    print("Ex43 — pipe pattern:\n", result)

def ex44():
    """Custom groupby aggregator"""
    def coeff_variation(x):
        return x.std() / x.mean() if x.mean() != 0 else np.nan
    df = pd.DataFrame({"team": ["A","A","B","B","B"], "perf": [80, 90, 60, 95, 70]})
    result = df.groupby("team")["perf"].agg(["mean","std", coeff_variation])
    result.columns = ["mean","std","cv"]
    print("Ex44 — CV per team:\n", result.round(3))

def ex45():
    """Categorical dtype (memory + ordering)"""
    df = pd.DataFrame({"size": ["M","L","S","XL","M","S","L","XL"] * 1000})
    df["size_cat"] = pd.Categorical(df["size"], categories=["S","M","L","XL"], ordered=True)
    mem_obj = df["size"].memory_usage(deep=True)
    mem_cat = df["size_cat"].memory_usage(deep=True)
    print(f"Ex45 — object mem: {mem_obj} B | categorical mem: {mem_cat} B | ratio: {mem_obj/mem_cat:.1f}x")
    print("       sorted unique:", sorted(df["size_cat"].unique()))

def ex46():
    """Large-scale simulation: central limit theorem"""
    rng = np.random.default_rng(99)
    sample_means = [rng.exponential(scale=2, size=30).mean() for _ in range(2000)]
    arr = np.array(sample_means)
    print(f"Ex46 — CLT simulation: mean={arr.mean():.3f} (expected~2.0) std={arr.std():.3f}")

def ex47():
    """JSON-like nested data flattening"""
    records = [
        {"id": 1, "info": {"age": 25, "city": "NY"}, "scores": [80, 90]},
        {"id": 2, "info": {"age": 30, "city": "LA"}, "scores": [70, 85]},
    ]
    flat = pd.DataFrame([
        {"id": r["id"], "age": r["info"]["age"], "city": r["info"]["city"],
         "avg_score": np.mean(r["scores"])}
        for r in records
    ])
    print("Ex47 — flattened nested data:\n", flat)

def ex48():
    """pandas query string"""
    df = pd.DataFrame({"age": [22, 35, 28, 45, 19], "salary": [40, 80, 55, 95, 30], "dept": list("ABABA")})
    result = df.query("age > 25 and salary > 50 and dept == 'A'")
    print("Ex48 — query result:\n", result)

def ex49():
    """DataFrame style-like formatting (to_string with float_format)"""
    df = pd.DataFrame(np.random.default_rng(3).random((4, 3)), columns=["alpha","beta","gamma"])
    df["label"] = ["low","high","mid","high"]
    formatted = df.to_string(float_format=lambda x: f"{x:.4f}")
    print("Ex49 — formatted DataFrame:\n", formatted)

def ex50():
    """Performance: numpy vs Python loop benchmark"""
    import time
    n = 500_000
    data = np.random.default_rng(0).random(n)

    t0 = time.perf_counter()
    py_sum = sum(x**2 for x in data)
    t_py = time.perf_counter() - t0

    t0 = time.perf_counter()
    np_sum = (data ** 2).sum()
    t_np = time.perf_counter() - t0

    print(f"Ex50 — numpy: {np_sum:.2f} in {t_np*1000:.2f}ms | "
          f"py loop: {py_sum:.2f} in {t_py*1000:.2f}ms | speedup: {t_py/t_np:.1f}x")


def main():
    print("=" * 60)
    print("Examples 1.1 — NumPy & Pandas Basics")
    print("=" * 60)

    print("\n─── BASIC (1–13) ───")
    ex01(); ex02(); ex03(); ex04(); ex05(); ex06(); ex07()
    ex08(); ex09(); ex10(); ex11(); ex12(); ex13()

    print("\n─── INTERMEDIATE (14–26) ───")
    ex14(); ex15(); ex16(); ex17(); ex18(); ex19(); ex20()
    ex21(); ex22(); ex23(); ex24(); ex25(); ex26()

    print("\n─── NESTED (27–38) ───")
    ex27(); ex28(); ex29(); ex30(); ex31(); ex32(); ex33()
    ex34(); ex35(); ex36(); ex37(); ex38()

    print("\n─── ADVANCED (39–50) ───")
    ex39(); ex40(); ex41(); ex42(); ex43(); ex44(); ex45()
    ex46(); ex47(); ex48(); ex49(); ex50()

if __name__ == "__main__":
    main()
