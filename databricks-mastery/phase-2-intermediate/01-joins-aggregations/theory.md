# Theory: Joins & Aggregations

## Joins in Spark

Joins combine two DataFrames on a matching key. They are **wide transformations** — they require a shuffle unless one side is broadcast.

### Join Types

```
Table A:  1, 2, 3, 4
Table B:  2, 3, 5, 6

INNER:      2, 3           (only matches)
LEFT:       1, 2, 3, 4     (all of A, null for non-matching B)
RIGHT:      2, 3, 5, 6     (all of B, null for non-matching A)
FULL OUTER: 1, 2, 3, 4, 5, 6  (all rows, nulls where no match)
LEFT ANTI:  1, 4           (A rows with NO match in B)
LEFT SEMI:  2, 3           (A rows that HAVE a match in B, no B columns)
CROSS:      16 rows        (every A × every B — cartesian)
```

### Syntax

```python
# Equal condition
df_a.join(df_b, "order_id", "inner")
df_a.join(df_b, ["order_id","date"], "left")    # multiple keys

# Non-equal or complex condition
df_a.join(df_b, df_a.id == df_b.customer_id, "left")

# Broadcast (send small table to every executor, skip shuffle)
from pyspark.sql.functions import broadcast
df_large.join(broadcast(df_small), "product_id")
```

---

## Join Strategies (Physical Plans)

| Strategy | When used | Cost |
|----------|-----------|------|
| **Broadcast Hash Join** | One side ≤ `autoBroadcastJoinThreshold` (default 10 MB) | Cheapest — no shuffle |
| **Sort Merge Join** | Both sides large | Expensive — full shuffle + sort |
| **Shuffle Hash Join** | Medium tables, one side fits in memory | Moderate |
| **Cartesian / Nested Loop** | Cross join or complex non-equi join | Very expensive |

```python
# Force broadcast (when you know a table is small but Spark doesn't auto-broadcast)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "209715200")  # 200 MB

# View join strategy in plan
df_joined.explain()   # look for BroadcastHashJoin vs SortMergeJoin
```

---

## Aggregations

### Basic aggregations

```python
from pyspark.sql import functions as F

df.agg(
    F.count("*").alias("total_rows"),
    F.countDistinct("customer_id").alias("unique_customers"),
    F.sum("amount").alias("revenue"),
    F.avg("amount").alias("avg_order"),
    F.min("amount").alias("min_order"),
    F.max("amount").alias("max_order"),
    F.stddev("amount").alias("stddev"),
    F.percentile_approx("amount", 0.5).alias("median"),
    F.first("status").alias("first_status"),
    F.collect_list("order_id").alias("all_order_ids"),
    F.collect_set("product_id").alias("distinct_products"),
)
```

### GroupBy aggregations

```python
df.groupBy("region", "category") \
  .agg(
      F.sum("amount").alias("revenue"),
      F.count("*").alias("orders"),
      F.countDistinct("customer_id").alias("customers"),
  ) \
  .orderBy(F.desc("revenue"))
```

### Pivot

```python
# Pivot: turn row values into columns
df.groupBy("customer_id") \
  .pivot("status", ["completed","refunded","pending"]) \
  .agg(F.count("*"))
# Result: customer_id | completed | refunded | pending
```

---

## Handling Join Skew

**Skew** occurs when one join key has vastly more rows than others (e.g., NULL, "UNKNOWN", one giant customer).

```
Normal:  Partition 1: 100 rows  Partition 2: 100 rows  Partition 3: 100 rows
Skewed:  Partition 1: 10 rows   Partition 2: 10 rows   Partition 3: 9,980 rows
→ Partition 3 task is 100× slower than others → job bottleneck
```

**Fix 1: AQE Skew Join (automatic)**
```python
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
```

**Fix 2: Salt the skewed key**
```python
# Sender side: replicate key N times with salt
n_buckets = 10
big_df = big_df.withColumn("key_salted",
    F.concat(F.col("customer_id"), F.lit("_"),
             (F.rand() * n_buckets).cast("int")))

# Smaller side: cross join with salted range
from functools import reduce
salted_small = reduce(
    lambda a, b: a.union(b),
    [small_df.withColumn("key_salted",
       F.concat(F.col("customer_id"), F.lit(f"_{i}")))
     for i in range(n_buckets)]
)
big_df.join(salted_small, "key_salted")
```

**Fix 3: Broadcast the skewed join partner** (if the partner is small enough)

---

## Common Interview Questions

**Q: What join strategies does Spark use and when?**  
A: Broadcast Hash Join (one side is small — fastest, no shuffle). Sort Merge Join (both sides large — shuffle + sort both sides). Shuffle Hash Join (medium tables — shuffle, build hash table on smaller side). Cartesian/Nested Loop Join (cross joins or non-equi conditions).

**Q: What is a broadcast join and when should you use it?**  
A: Broadcast copies the small DataFrame to every executor, eliminating the shuffle on the large side. Use when: one side < ~200 MB. Force with `F.broadcast(df)` hint or increase `autoBroadcastJoinThreshold`.

**Q: How do you detect and fix data skew in joins?**  
A: Detect: in Spark UI, one task takes much longer than others in the same stage. Fix: (1) Enable AQE skew join (automatic, recommended). (2) Filter/remove the skewed key and handle separately. (3) Salt the key — replicate both sides with N random suffixes to spread the skew across partitions.

**Q: What is the difference between `left_anti` and `left_semi`?**  
A: `left_semi` returns rows from the left DataFrame that have at least one match in the right (like EXISTS in SQL). `left_anti` returns rows from the left with NO match in the right (like NOT EXISTS). Neither includes columns from the right side.

**Q: What is the difference between `count("*")` and `count("col")`?**  
A: `count("*")` counts all rows including nulls. `count("col")` counts only non-null values in that column. Use `countDistinct("col")` for unique non-null values.

**Q: How does pivot work in Spark?**  
A: `pivot("col", ["val1","val2"])` turns distinct values of a column into column headers, then aggregates. Without specifying values, Spark scans the data to find all distinct values (expensive — always specify values explicitly in production).

---

## Quick Reference

```python
# Join types
df1.join(df2, "key", "inner")    # = "inner" (default)
df1.join(df2, "key", "left")
df1.join(df2, "key", "right")
df1.join(df2, "key", "outer")    # = "full" = "fullouter"
df1.join(df2, "key", "left_anti")
df1.join(df2, "key", "left_semi")
df1.join(broadcast(df2), "key")  # broadcast join

# Aggregation functions
F.count("*"), F.countDistinct("col")
F.sum("col"), F.avg("col"), F.mean("col")
F.min("col"), F.max("col"), F.stddev("col")
F.first("col"), F.last("col")
F.collect_list("col"), F.collect_set("col")
F.percentile_approx("col", [0.25, 0.5, 0.75])
F.sum_distinct("col")
F.var_pop("col"), F.var_samp("col")
```
