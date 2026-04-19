# Theory: Window Functions

## What are Window Functions?
Window functions compute a value for each row based on a **window** (group) of related rows, without collapsing the result to one row per group (unlike `groupBy`). They are essential for ranking, running totals, moving averages, and comparing each row to its peers.

```python
from pyspark.sql.window import Window
from pyspark.sql import functions as F

# Define the window spec first
window_spec = Window.partitionBy("category").orderBy("amount")

# Apply a window function
df = df.withColumn("rank", F.rank().over(window_spec))
```

---

## Window Spec Components

```python
Window
  .partitionBy("col")       # Group rows into partitions (like GROUP BY)
  .orderBy("col")           # Order rows within each partition
  .rowsBetween(start, end)  # Frame: relative row offsets
  .rangeBetween(start, end) # Frame: relative value range

# Frame constants
Window.unboundedPreceding  # = Long.MinValue
Window.unboundedFollowing  # = Long.MaxValue
Window.currentRow          # = 0
```

---

## Ranking Functions

```python
w = Window.partitionBy("region").orderBy(F.col("sales").desc())

# rank: gaps for ties (1, 1, 3, 4)
df.withColumn("rank",       F.rank().over(w))

# dense_rank: no gaps for ties (1, 1, 2, 3)
df.withColumn("dense_rank", F.dense_rank().over(w))

# row_number: unique sequential (1, 2, 3, 4) — arbitrary tiebreak
df.withColumn("row_number", F.row_number().over(w))

# percent_rank: 0.0 to 1.0
df.withColumn("pct_rank",   F.percent_rank().over(w))

# ntile: divide into N buckets (quartiles = ntile(4))
df.withColumn("quartile",   F.ntile(4).over(w))
```

**Key use case: keep the latest record per key**
```python
w = Window.partitionBy("order_id").orderBy(F.col("updated_at").desc())
df.withColumn("rn", F.row_number().over(w)) \
  .filter(F.col("rn") == 1) \
  .drop("rn")
```

---

## Offset Functions (Lag/Lead)

```python
w = Window.partitionBy("customer_id").orderBy("order_date")

# Previous row's value
df.withColumn("prev_amount", F.lag("amount", 1).over(w))
df.withColumn("prev_amount", F.lag("amount", 1, 0.0).over(w))  # default=0.0

# Next row's value
df.withColumn("next_amount", F.lead("amount", 1).over(w))

# Day-over-day change
df.withColumn("amount_change", F.col("amount") - F.lag("amount",1).over(w))

# Growth %
df.withColumn("growth_pct",
    F.round((F.col("amount") - F.lag("amount",1).over(w)) /
             F.lag("amount",1).over(w) * 100, 1))
```

---

## Aggregate Window Functions

```python
# Running total (cumulative sum)
w_cumul = Window.partitionBy("customer_id") \
                .orderBy("order_date") \
                .rowsBetween(Window.unboundedPreceding, Window.currentRow)
df.withColumn("running_total", F.sum("amount").over(w_cumul))

# Moving average (last 3 rows including current)
w_moving = Window.partitionBy("product_id") \
                 .orderBy("date") \
                 .rowsBetween(-2, 0)   # 2 rows before + current
df.withColumn("ma3", F.avg("sales").over(w_moving))

# 7-day moving average (by date range, not row count)
w_range = Window.partitionBy("product_id") \
                .orderBy(F.col("date").cast("long")) \
                .rangeBetween(-6 * 86400, 0)  # 6 days before in seconds
df.withColumn("ma7", F.avg("sales").over(w_range))

# Partition-level total (without collapsing rows)
w_part = Window.partitionBy("category")
df.withColumn("category_total", F.sum("amount").over(w_part))
df.withColumn("pct_of_category", F.col("amount") / F.col("category_total") * 100)

# Global aggregate
w_global = Window.partitionBy()   # empty partition = whole DataFrame
df.withColumn("pct_of_total", F.col("amount") / F.sum("amount").over(w_global) * 100)
```

---

## rows vs range Frames

| | `rowsBetween` | `rangeBetween` |
|--|---------------|----------------|
| Offset type | Physical row count | Value range (based on ORDER BY column) |
| Use when | You want exactly N rows | You want a time window (e.g., "last 7 days") |
| Ties handled | Deterministic (N rows counted) | All rows in value range included |

```python
# rowsBetween(-1, 1): window = 1 row before + current + 1 row after
# rangeBetween(-7, 0): window = all rows with value within 7 units of current
```

---

## Performance Notes

- Window functions require a **shuffle** — all rows in the same partition are sent to the same executor.
- Large partitions can cause OOM — ensure the `partitionBy` column has enough distinct values.
- If you need multiple window specs, define each as a separate variable and chain withColumn calls.
- Avoid `Window.partitionBy()` (global window) on large DataFrames — forces all data to one executor.

---

## Common Interview Questions

**Q: What is the difference between `rank`, `dense_rank`, and `row_number`?**  
A: All assign sequential numbers within a window. `row_number` is always unique (arbitrary tie-break). `rank` assigns the same number to ties but skips numbers after ties (1,1,3). `dense_rank` assigns the same number to ties with no gaps (1,1,2).

**Q: How do you compute a running total in PySpark?**  
A: Use `F.sum("col").over(Window.partitionBy("key").orderBy("date").rowsBetween(Window.unboundedPreceding, Window.currentRow))`. The `rowsBetween(unboundedPreceding, currentRow)` frame means "all rows from the start of the partition up to the current row."

**Q: What is the difference between `rowsBetween` and `rangeBetween`?**  
A: `rowsBetween` counts physical rows (position). `rangeBetween` uses the ORDER BY column's values. For time-based windows (e.g., "last 7 days"), use `rangeBetween` with the date cast to a numeric type (seconds since epoch).

**Q: How do you get the previous row's value in a time series?**  
A: Use `F.lag("col", N).over(window_spec)`. `lag("amount", 1)` returns the amount from the previous row within the partition ordered by date. The second argument `N` is the offset; optional third argument is the default value for rows with no previous entry.

**Q: How do you deduplicate keeping the latest record?**  
A: Use `row_number()` over a window partitioned by the key column, ordered by timestamp descending: `.withColumn("rn", row_number().over(Window.partitionBy("id").orderBy(col("ts").desc()))).filter(col("rn")==1).drop("rn")`.

---

## Quick Reference

```python
from pyspark.sql.window import Window
from pyspark.sql import functions as F

# Ranking
w = Window.partitionBy("p_col").orderBy(F.col("o_col").desc())
F.row_number().over(w)
F.rank().over(w)
F.dense_rank().over(w)
F.percent_rank().over(w)
F.ntile(4).over(w)

# Lag/Lead
F.lag("col", 1).over(w)           # prev row
F.lead("col", 1, default).over(w) # next row

# Aggregates with frames
w_running = w.rowsBetween(Window.unboundedPreceding, Window.currentRow)
w_rolling = w.rowsBetween(-6, 0)  # last 7 rows
w_all     = Window.partitionBy("group")  # whole partition (no order)

F.sum("col").over(w_running)      # cumulative
F.avg("col").over(w_rolling)      # rolling avg
F.max("col").over(w_all)          # group max (no collapse)
F.first("col").over(w)            # first in partition
F.last("col").over(w)             # last in partition
```
