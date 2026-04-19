# Theory: Data Quality

## What is Data Quality?

Data quality (DQ) is the degree to which data is fit for its intended use. The six dimensions most relevant to Spark/Databricks pipelines:

| Dimension | Definition | Example check |
|-----------|-----------|---------------|
| Completeness | No unexpected nulls | `null_rate("email") < 0.01` |
| Uniqueness | No unexpected duplicates | `count(*) == countDistinct("order_id")` |
| Validity | Values in allowed domain | `status IN ('pending','completed','refunded')` |
| Accuracy | Values match source | row count matches upstream |
| Freshness | Data is recent enough | `max(created_at) > now() - 1 hour` |
| Consistency | Cross-table agreement | orders.customer_id exists in customers table |

---

## Basic DQ Checks in PySpark

```python
from pyspark.sql import functions as F

def run_dq_checks(df, table_name):
    results = []
    total = df.count()

    # 1. Null rate check
    null_count = df.filter(F.col("order_id").isNull()).count()
    results.append({"check": "null_order_id", "passed": null_count == 0,
                    "value": null_count})

    # 2. Uniqueness check
    distinct_count = df.select("order_id").distinct().count()
    results.append({"check": "unique_order_id", "passed": distinct_count == total,
                    "value": total - distinct_count})  # duplicate count

    # 3. Domain validity
    invalid_status = df.filter(
        ~F.col("status").isin("pending", "completed", "refunded")).count()
    results.append({"check": "valid_status", "passed": invalid_status == 0,
                    "value": invalid_status})

    # 4. Numeric range
    negative_amount = df.filter(F.col("amount") <= 0).count()
    results.append({"check": "positive_amount", "passed": negative_amount == 0,
                    "value": negative_amount})

    # 5. Row count SLA
    results.append({"check": "min_row_count", "passed": total >= 1000,
                    "value": total})

    return results
```

---

## Delta Constraints (Declarative DQ)

```python
# Enforce at write time — Delta rejects rows that violate constraints
spark.sql("ALTER TABLE silver.orders ADD CONSTRAINT valid_amount CHECK (amount > 0)")
spark.sql("ALTER TABLE silver.orders ADD CONSTRAINT valid_status CHECK (status IN ('pending','completed','refunded'))")

# On violation: AnalysisException is raised — entire batch is rejected
# View constraints
spark.sql("DESCRIBE DETAIL silver.orders").select("properties").show(truncate=False)
```

---

## Delta Live Tables (DLT) Expectations

DLT is Databricks' declarative ETL framework with built-in DQ:

```python
import dlt
from pyspark.sql import functions as F

@dlt.table(comment="Cleaned orders with DQ expectations")
@dlt.expect("valid_amount",   "amount > 0")
@dlt.expect("non_null_order", "order_id IS NOT NULL")
@dlt.expect_or_drop("valid_status", "status IN ('pending','completed','refunded')")
@dlt.expect_or_fail("unique_order", "order_id IS NOT NULL")  # fail pipeline
def silver_orders():
    return (dlt.read_stream("bronze_orders")
        .select("order_id", "customer_id", "amount", "status", "created_at"))
```

**DLT Expectation Actions**:
| Decorator | On violation | Use case |
|-----------|-------------|---------|
| `@dlt.expect` | Log metric (allow row through) | Monitoring only |
| `@dlt.expect_or_drop` | Drop the violating row | Soft enforcement |
| `@dlt.expect_or_fail` | Fail the pipeline | Hard enforcement |

---

## Statistical DQ — Z-Score Anomaly Detection

```python
def is_anomaly(history: list, new_val: float, threshold: float = 2.0) -> bool:
    """Return True if new_val is more than `threshold` standard deviations from mean."""
    if len(history) < 2:
        return False
    import statistics
    mean = statistics.mean(history)
    std  = statistics.stdev(history)
    if std == 0:
        return False
    z = abs(new_val - mean) / std
    return z > threshold

# Track daily row counts
history = [95000, 103000, 98000, 101000, 97000]
today   = 12000   # suspicious drop
print(is_anomaly(history, today, threshold=2.0))  # True
```

---

## DQ Scoring

Combine multiple checks into a single score for SLA monitoring:

```python
def dq_score(checks_passed: list, weights: list = None) -> float:
    """
    Returns weighted DQ score 0–100.
    checks_passed: list of booleans (True = check passed)
    weights: list of floats summing to 1.0 (equal weight if None)
    """
    n = len(checks_passed)
    if n == 0:
        return 0.0
    if weights is None:
        weights = [1.0 / n] * n
    return round(sum(w * (1.0 if p else 0.0)
                     for p, w in zip(checks_passed, weights)) * 100, 2)

# Example
checks  = [True, True, False, True]   # 3/4 checks pass
weights = [0.4, 0.3, 0.2, 0.1]       # critical checks weighted higher
print(dq_score(checks, weights))      # 80.0
```

---

## Dead-Letter Queue for DQ

```python
def apply_dq_filter(batch_df, sink_path, dlq_path):
    valid_rules = (
        F.col("order_id").isNotNull() &
        (F.col("amount") > 0) &
        F.col("status").isin("pending", "completed", "refunded")
    )

    valid_df   = batch_df.filter(valid_rules)
    invalid_df = batch_df.filter(~valid_rules) \
        .withColumn("_error_reason",
            F.when(F.col("order_id").isNull(), "null_order_id")
             .when(F.col("amount") <= 0,       "invalid_amount")
             .otherwise("invalid_status")) \
        .withColumn("_rejected_at", F.current_timestamp())

    valid_df.write.format("delta").mode("append").save(sink_path)
    invalid_df.write.format("delta").mode("append").save(dlq_path)

    return valid_df.count(), invalid_df.count()
```

---

## Schema Contract Validation

```python
def validate_schema(df, expected: dict, label: str = ""):
    """
    expected: {"col_name": DataType}
    Raises ValueError if any column is missing or has wrong type.
    """
    actual = {f.name: f.dataType for f in df.schema.fields}
    for col, dtype in expected.items():
        if col not in actual:
            raise ValueError(f"[{label}] Missing column: {col}")
        if not isinstance(actual[col], type(dtype)):
            raise ValueError(
                f"[{label}] Column '{col}' type mismatch: "
                f"expected {dtype}, got {actual[col]}")

# Usage
from pyspark.sql.types import LongType, StringType, DoubleType
expected = {
    "order_id":   LongType(),
    "amount":     DoubleType(),
    "status":     StringType(),
}
validate_schema(df, expected, label="silver_orders")
```

---

## Common Interview Questions

**Q: What are the six dimensions of data quality?**  
A: Completeness (no unexpected nulls), Uniqueness (no unexpected duplicates), Validity (values in allowed domain), Accuracy (values match source truth), Freshness (data is recent enough), Consistency (cross-table referential integrity).

**Q: What are Delta Lake constraints and when do they fail?**  
A: `CHECK` constraints are enforced on every write — if any row violates the constraint, the entire batch is rejected with an `AnalysisException`. They're a last-resort guardrail; most DQ should be caught earlier in the pipeline to route bad rows to a dead-letter queue rather than failing the whole batch.

**Q: What is a dead-letter queue and why is it better than dropping bad rows?**  
A: A DLQ captures rejected rows with an `_error_reason` column. Instead of silently discarding data, it lets teams: (1) inspect what failed and why, (2) fix the source and reprocess, (3) track rejection rates over time, (4) alert on anomalous spikes in rejections.

**Q: What is DLT and how do its expectations work?**  
A: Delta Live Tables is Databricks' declarative pipeline framework. `@dlt.expect` logs violations as metrics but lets rows through. `@dlt.expect_or_drop` silently drops violating rows. `@dlt.expect_or_fail` halts the pipeline on any violation. The DLT UI shows per-expectation pass/fail counts.

**Q: How do you detect anomalous data volumes in a pipeline?**  
A: Track daily/batch row counts in a history table. Use z-score: if the new count deviates more than 2–3 standard deviations from historical mean, flag it. This catches both sudden drops (upstream outage) and sudden spikes (data duplication).

---

## Quick Reference

```python
# Basic null check
null_count = df.filter(F.col("col").isNull()).count()

# Uniqueness
dup_count = df.count() - df.select("key").distinct().count()

# Domain validity
invalid = df.filter(~F.col("status").isin("a","b","c")).count()

# Freshness
from datetime import datetime, timedelta
max_ts = df.agg(F.max("created_at")).collect()[0][0]
is_fresh = (datetime.now() - max_ts) < timedelta(hours=1)

# DQ score
def dq_score(passed, weights=None):
    n = len(passed)
    w = weights or [1/n]*n
    return round(sum(wi*(1. if p else 0.) for p,wi in zip(passed,w))*100,2)

# Schema validation
validate_schema(df, {"col": LongType(), "val": DoubleType()})

# Delta constraint
ALTER TABLE t ADD CONSTRAINT positive_amount CHECK (amount > 0)

# DLT
@dlt.expect("non_null_key", "order_id IS NOT NULL")
@dlt.expect_or_drop("valid_amount", "amount > 0")
@dlt.expect_or_fail("critical_check", "customer_id IS NOT NULL")
```
