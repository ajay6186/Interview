# Theory: DataFrame Operations

## What are DataFrame Operations?
DataFrame operations are the building blocks for data manipulation in PySpark. They fall into two categories: **transformations** (lazy, return new DataFrames) and **actions** (trigger execution). Mastering these is the most important PySpark skill.

---

## Core Transformation Categories

### 1. Column Operations
```python
# Select
df.select("name", "age")
df.select(F.col("name"), F.col("age") + 1)

# Add / modify column
df.withColumn("price_tax", F.col("price") * 1.1)

# Rename
df.withColumnRenamed("old_name", "new_name")

# Drop
df.drop("unwanted_col")

# Cast
df.withColumn("age", F.col("age").cast("integer"))
```

### 2. Row Filtering
```python
df.filter(F.col("age") > 18)
df.filter(F.col("status").isin("active","pending"))
df.filter(F.col("name").isNotNull())
df.filter(F.col("price").between(10, 100))
df.filter(F.col("name").like("A%"))   # SQL LIKE pattern
```

### 3. Aggregation
```python
df.groupBy("category").agg(
    F.count("*").alias("total"),
    F.sum("price").alias("revenue"),
    F.avg("price").alias("avg_price"),
    F.min("price").alias("min_price"),
    F.max("price").alias("max_price"),
    F.countDistinct("customer_id").alias("unique_customers"),
    F.collect_list("item").alias("item_list"),
)
```

### 4. Joins
```python
# Inner, left, right, full, left_anti, left_semi
df1.join(df2, "customer_id", "left")
df1.join(df2, df1.id == df2.customer_id, "inner")
df1.join(F.broadcast(df2), "product_id")  # broadcast small table
```

### 5. Sorting
```python
df.orderBy("age")
df.orderBy(F.col("price").desc())
df.orderBy(F.col("name").asc_nulls_last())
```

---

## Join Types

```
Inner join:      only matching rows from both sides
Left join:       all rows from left, matched from right (null if no match)
Right join:      all rows from right, matched from left
Full outer:      all rows from both, nulls where no match
Left anti:       rows from left with NO match in right (set difference)
Left semi:       rows from left WITH a match in right (no right columns)
Cross join:      cartesian product (every combination)
```

```
Left:   A B C D
Right:  B C E F

Inner:      B C
Left:       A B C D  (with nulls for A,D right side)
Right:      B C E F  (with nulls for E,F left side)
Full:       A B C D E F
Left anti:  A D
Left semi:  B C
```

---

## Null Handling

```python
df.na.drop()                    # drop rows with ANY null
df.na.drop(subset=["col1"])     # drop only if col1 is null
df.na.fill(0)                   # fill all numeric nulls with 0
df.na.fill({"col1": 0, "col2": "unknown"})  # per-column fill
df.na.replace(["N/A",""], None, subset=["name"])  # replace values
F.coalesce(F.col("a"), F.col("b"), F.lit("default"))  # first non-null
F.when(F.col("x").isNull(), F.lit(0)).otherwise(F.col("x"))
```

---

## String Functions

```python
F.upper("name"),  F.lower("name"),  F.trim("name")
F.ltrim("name"),  F.rtrim("name")
F.concat(F.col("first"), F.lit(" "), F.col("last"))
F.concat_ws("-", "year", "month", "day")
F.substring("phone", 1, 3)         # 1-indexed
F.regexp_replace("phone", r"[- ]", "")
F.regexp_extract("email", r"@(.+)", 1)
F.split("tags", ",")               # → ArrayType
F.length("name")
F.lpad("code", 5, "0")             # left-pad with zeros
```

---

## Date/Time Functions

```python
F.current_date()
F.current_timestamp()
F.to_date("date_str", "yyyy-MM-dd")
F.to_timestamp("ts_str", "yyyy-MM-dd HH:mm:ss")
F.date_format("date_col", "yyyy-MM")
F.year("date"), F.month("date"), F.dayofweek("date")
F.datediff("end_date", "start_date")         # days between
F.date_add("date", 7)                        # add 7 days
F.months_between("end","start")
F.trunc("date", "month")                     # truncate to month
F.date_trunc("hour", "timestamp")
```

---

## Conditional Logic

```python
F.when(F.col("age") < 18, "minor") \
 .when(F.col("age") < 65, "adult") \
 .otherwise("senior")

F.expr("CASE WHEN age < 18 THEN 'minor' ELSE 'adult' END")

F.if(F.col("status") == "active", F.col("price"), F.lit(0))
# Note: Python `if` doesn't work on columns — always use F.when
```

---

## Deduplication

```python
df.distinct()                        # remove completely identical rows
df.dropDuplicates(["order_id"])      # keep first by key column(s)

# Keep latest by timestamp (window-based dedup)
from pyspark.sql.window import Window
w = Window.partitionBy("order_id").orderBy(F.col("updated_at").desc())
df.withColumn("rn", F.row_number().over(w)).filter(F.col("rn") == 1).drop("rn")
```

---

## Performance Tips

| Tip | Why |
|-----|-----|
| Filter early (before joins) | Reduce rows entering the shuffle |
| Select only needed columns | Column pruning reduces I/O |
| Broadcast small tables | Eliminates shuffle for one join side |
| Avoid `collect()` on large DFs | Brings all data to driver |
| Chain transformations (don't break into steps) | Catalyst can optimize the full chain |
| Avoid `udf` where native functions exist | Native functions are JVM-compiled |

---

## Common Interview Questions

**Q: What is the difference between `filter` and `where`?**  
A: They are identical in PySpark. `where` is just an alias for `filter`. Use whichever reads more naturally.

**Q: What is the difference between `select` and `withColumn`?**  
A: `select` returns only the specified columns. `withColumn` returns all existing columns plus/modified one. For multiple new columns, chaining `withColumn` is less efficient than `select` because it rebuilds the plan for each call.

**Q: How do you handle null values in PySpark?**  
A: Use `df.na.drop()` to remove rows, `df.na.fill()` to replace with defaults, `F.coalesce()` to pick the first non-null across columns, and `F.when(col.isNull(), default).otherwise(col)` for conditional replacement.

**Q: What is a broadcast join and when should you use it?**  
A: A broadcast join sends a copy of the smaller DataFrame to every executor, avoiding a shuffle. Use it when one side is small enough to fit in executor memory (typically < 200 MB). Spark auto-broadcasts tables below `spark.sql.autoBroadcastJoinThreshold` (default 10 MB). Add `F.broadcast(df)` hint for explicit control.

**Q: What is the difference between `groupBy.agg` and `groupBy.count`?**  
A: `groupBy.count()` returns row counts per group. `groupBy.agg()` allows multiple aggregation functions in one pass (more efficient). Always prefer `agg()` for multiple metrics to avoid scanning the data multiple times.

**Q: Explain `left_anti` and `left_semi` joins.**  
A: `left_semi` keeps rows from the left side that have at least one match in the right — like a filter using the right table's keys. `left_anti` keeps rows from the left with NO match in the right — the opposite, useful for finding "orphaned" records.

**Q: How do you deduplicate data in PySpark?**  
A: `distinct()` removes fully identical rows. `dropDuplicates(["key_col"])` keeps the first occurrence per key. For "keep latest by timestamp," use `window.partitionBy(key).orderBy(ts.desc)` with `row_number()` and filter for `rn == 1`.

---

## Quick Reference

```python
from pyspark.sql import functions as F
from pyspark.sql.window import Window

# Aggregate functions
F.count("*"),  F.countDistinct("col")
F.sum("x"),    F.avg("x"),    F.mean("x")
F.min("x"),    F.max("x"),    F.stddev("x")
F.first("x"),  F.last("x"),   F.collect_list("x")
F.percentile_approx("x", 0.5)
F.round("x", 2)
F.abs("x")
F.lit(42)       # literal value as column
F.col("name")   # reference column by name
F.expr("sql expression")

# Null helpers
F.isNull(), F.isNotNull()
F.coalesce(col1, col2, lit("default"))
df.na.fill({"col": 0})

# Type conversion
F.col("x").cast("double")
F.col("x").cast("timestamp")
```
