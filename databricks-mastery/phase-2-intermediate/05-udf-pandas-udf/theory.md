# Theory: UDFs & Pandas UDFs

## What is a UDF?
A User-Defined Function (UDF) is a custom Python function registered with Spark so it can be applied to DataFrame columns. Use UDFs **only when there is no native Spark function** that does what you need — native functions are always faster.

---

## Python UDF (Row-at-a-Time)

```python
from pyspark.sql.functions import udf
from pyspark.sql.types import StringType, IntegerType

# Method 1: udf decorator
@udf(StringType())
def format_phone(phone: str) -> str:
    if phone is None:
        return None
    return phone.replace("-","").replace(" ","").strip()

df.withColumn("phone_clean", format_phone(F.col("phone")))

# Method 2: udf() function
def categorize_age(age):
    if age is None: return None
    if age < 18: return "minor"
    if age < 65: return "adult"
    return "senior"

age_category = udf(categorize_age, StringType())
df.withColumn("age_group", age_category(F.col("age")))
```

### How Python UDFs Work (and Why They're Slow)

```
JVM (Spark executor)                  Python process
─────────────────────                 ─────────────────────
Row 1 → serialize (pickle) ────────► deserialize
                                      run Python function
                           ◄──────── serialize result (pickle)
Row 2 → serialize          ────────► deserialize
                                      ...
Row N → serialize          ────────► ...
```

Every row crosses the JVM ↔ Python boundary with serialization. This is 10–100× slower than native functions that stay in the JVM.

---

## Pandas UDF (Vectorized UDF)

Pandas UDFs process an entire column as a pandas Series (via Apache Arrow — no pickle serialization per row). Much faster than row-at-a-time UDFs.

```python
from pyspark.sql.functions import pandas_udf
import pandas as pd

# Scalar Pandas UDF (one Series in → one Series out)
@pandas_udf(StringType())
def upper_batch(s: pd.Series) -> pd.Series:
    return s.str.upper()

df.withColumn("name_upper", upper_batch(F.col("name")))

# Multi-column input
@pandas_udf(DoubleType())
def weighted_score(score: pd.Series, weight: pd.Series) -> pd.Series:
    return score * weight / 100.0

df.withColumn("wscore", weighted_score(F.col("score"), F.col("weight")))
```

### Grouped Map Pandas UDF (MapInPandas)

Process each group as a full pandas DataFrame — useful for complex group-level transforms.

```python
def normalize_by_group(pdf: pd.DataFrame) -> pd.DataFrame:
    """Scale scores within each group to 0-1."""
    min_s = pdf["score"].min()
    max_s = pdf["score"].max()
    pdf["score_norm"] = (pdf["score"] - min_s) / (max_s - min_s) if max_s > min_s else 0.0
    return pdf

from pyspark.sql.types import StructType, StructField, StringType, DoubleType
schema = StructType([
    StructField("group", StringType()),
    StructField("score", DoubleType()),
    StructField("score_norm", DoubleType()),
])

df.groupBy("group").applyInPandas(normalize_by_group, schema=schema)
```

---

## Spark SQL UDFs

```python
# Register for use in SQL queries
spark.udf.register("format_phone", format_phone, StringType())
spark.sql("SELECT format_phone(phone) AS phone_clean FROM orders")
```

---

## Performance Comparison

| Type | Serialization | Speed | Use case |
|------|--------------|-------|---------|
| Native functions (`F.*`) | None (JVM) | Fastest | Anything native supports |
| Pandas UDF (scalar) | Arrow (batch) | Fast (~3–5× overhead) | Vectorized Python/NumPy logic |
| Python UDF (row-at-a-time) | Pickle (per-row) | Slow (10–100×) | Last resort for complex logic |
| Grouped Map Pandas UDF | Arrow (per group) | Moderate | Group-level complex transforms |

---

## When to Use UDFs

**Use native functions** (always check first):
```python
# Bad (UDF):
@udf(StringType())
def clean(s): return s.strip().upper() if s else None

# Good (native):
F.upper(F.trim(F.col("name")))
```

**Use Pandas UDF when**: you need numpy/scipy/scikit-learn operations, regex with complex logic, or string manipulation not available as native functions.

**Use Python UDF when**: complex business logic that genuinely can't be expressed natively and performance is not critical.

---

## Null Handling in UDFs

Python UDFs receive `None` for null values. Always guard against null inputs:

```python
@udf(DoubleType())
def safe_divide(numerator, denominator):
    if numerator is None or denominator is None or denominator == 0:
        return None
    return numerator / denominator
```

Pandas UDFs receive `NaN` or `pd.NaT` for nulls in numeric/datetime columns and `None` in object columns. Handle with `pd.isna()` or `fillna()`.

---

## Common Interview Questions

**Q: Why are Python UDFs slow in PySpark?**  
A: Python UDFs process one row at a time, with each row requiring serialization (pickle) from the JVM executor to the Python process, execution of the Python function, and deserialization of the result back to JVM. This per-row serialization overhead is 10–100× slower than native functions that run entirely in the JVM.

**Q: What is a Pandas UDF and how does it improve performance?**  
A: Pandas UDFs (vectorized UDFs) use Apache Arrow to transfer entire columns as pandas Series between JVM and Python — a single bulk transfer instead of per-row serialization. This reduces overhead to ~3–5× instead of 10–100×. They're defined with `@pandas_udf` decorator.

**Q: When should you use a UDF vs a native function?**  
A: Always check native functions first (`F.trim()`, `F.regexp_replace()`, `F.when()`, etc.). Use UDFs only for logic that genuinely cannot be expressed with native functions — e.g., calling a third-party library (scikit-learn, spaCy), complex multi-step string parsing, or business rules with many conditions.

**Q: What is `applyInPandas` and when do you use it?**  
A: `groupBy(...).applyInPandas(fn, schema)` calls your function with a full pandas DataFrame for each group. Use it for group-level operations like per-group normalisation, fitting a model per group, or complex aggregations that can't be expressed with standard `agg()` functions.

**Q: How do you handle nulls in UDFs?**  
A: In Python UDFs, null values arrive as Python `None` — always check `if value is None: return None`. In Pandas UDFs, use `pd.isna()` or `Series.fillna()`. Forgetting null checks causes UDFs to raise exceptions or return incorrect results on null inputs.

---

## Quick Reference

```python
from pyspark.sql.functions import udf, pandas_udf
from pyspark.sql.types import StringType, DoubleType, IntegerType
import pandas as pd

# Python UDF
@udf(StringType())
def my_udf(val: str) -> str:
    return val.upper() if val else None

# Pandas UDF (scalar)
@pandas_udf(DoubleType())
def my_pandas_udf(s: pd.Series) -> pd.Series:
    return s * 1.1

# Register for SQL
spark.udf.register("my_udf", my_udf)

# Apply
df.withColumn("result", my_udf(F.col("col")))
df.withColumn("result", my_pandas_udf(F.col("col")))
spark.sql("SELECT my_udf(col) FROM table")

# Grouped map
df.groupBy("group").applyInPandas(fn, schema=output_schema)
```
