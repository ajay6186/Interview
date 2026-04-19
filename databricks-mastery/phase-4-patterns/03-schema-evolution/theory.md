# Theory: Schema Evolution

## What is Schema Evolution?

Schema evolution is the ability to handle changes to a data schema over time — new columns, renamed columns, changed types — without breaking pipelines or losing data.

```
Schema changes over time:

v1: {order_id: LONG, amount: DOUBLE, status: STRING}
v2: {order_id: LONG, amount: DOUBLE, status: STRING, region: STRING}   ← new column
v3: {order_id: LONG, amount: DOUBLE, status: STRING, region: STRING,
     discount: DOUBLE}                                                  ← another new column
```

---

## Delta Lake Schema Enforcement vs Evolution

```python
# SCHEMA ENFORCEMENT (default): rejects writes that don't match table schema
df_new.write.format("delta").mode("append").save("/delta/orders")
# AnalysisException: if df_new has extra/missing/incompatible columns

# SCHEMA EVOLUTION: automatically merge new columns
df_new.write.format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \  # allow new columns to be added
    .save("/delta/orders")
# New columns appear as NULL in old rows, populated in new rows

# TABLE-LEVEL auto merge (applies to all writes)
spark.sql("""
ALTER TABLE orders SET TBLPROPERTIES (
    'delta.columnMapping.mode' = 'name',
    'delta.minReaderVersion' = '2',
    'delta.minWriterVersion' = '5'
)
""")
spark.conf.set("spark.databricks.delta.schema.autoMerge.enabled", "true")
```

---

## Types of Schema Changes

### 1. Adding Columns (safe — always supported)
```python
# mergeSchema adds new column; old rows get NULL for that column
df_with_new_col.write.format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .saveAsTable("orders")
```

### 2. Dropping Columns (safe with Column Mapping)
```python
# Enable column mapping first (allows logical column drops)
spark.sql("""
ALTER TABLE orders SET TBLPROPERTIES (
    'delta.columnMapping.mode' = 'name'
)
""")
spark.sql("ALTER TABLE orders DROP COLUMN discount")
# Physical files still contain the column data; it's hidden from schema
```

### 3. Renaming Columns (safe with Column Mapping)
```python
# Rename without rewriting data files
spark.sql("""
ALTER TABLE orders SET TBLPROPERTIES ('delta.columnMapping.mode' = 'name')
""")
spark.sql("ALTER TABLE orders RENAME COLUMN order_status TO status")
```

### 4. Changing Data Types (limited support)
```python
# Widening (safe): INT → LONG, FLOAT → DOUBLE, DATE → TIMESTAMP
spark.sql("ALTER TABLE orders ALTER COLUMN amount TYPE DOUBLE")

# Narrowing or incompatible: NOT supported directly
# Must rewrite: read → cast → overwrite
df = spark.read.table("orders")
df.withColumn("amount", F.col("amount").cast("double")) \
  .write.format("delta").mode("overwrite").option("overwriteSchema", "true") \
  .saveAsTable("orders")
```

---

## `overwriteSchema` vs `mergeSchema`

```python
# mergeSchema: ADD new columns, keep existing ones
df.write.option("mergeSchema", "true").mode("append")

# overwriteSchema: REPLACE entire schema (dangerous — changes type, removes columns)
df.write.option("overwriteSchema", "true").mode("overwrite")
# Use with caution: downstream queries may break if columns are removed/renamed
```

| Option | What it does | When to use |
|--------|-------------|-------------|
| `mergeSchema=true` | Adds new columns from source | Normal schema evolution |
| `overwriteSchema=true` | Replaces the whole schema | Schema refactor / type change |
| Neither (default) | Enforces schema strictly | Production writes (fail fast) |

---

## Handling Schema Drift in Streaming

```python
# Auto Loader handles schema evolution automatically
stream_df = (spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format", "json")
    .option("cloudFiles.schemaLocation", "/schema/orders")   # stores inferred schema
    .option("cloudFiles.inferColumnTypes", "true")
    .load("s3://landing/orders/"))

# When new column appears in source files:
# - First trigger: schema evolution detected, stream restarts with new schema
# - cloudFiles.schemaEvolutionMode options:
#   - "addNewColumns" (default): new columns added, old rows get null
#   - "failOnNewColumns": fail on new column (strict mode)
#   - "rescue": unknown columns go to _rescued_data column
stream_df = (spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.schemaEvolutionMode", "addNewColumns")
    .option("cloudFiles.schemaLocation", "/schema/orders")
    .load("s3://landing/orders/"))
```

---

## Schema Contract Enforcement

```python
from pyspark.sql.types import StructType, StructField, LongType, StringType, DoubleType

EXPECTED_SCHEMA = StructType([
    StructField("order_id",   LongType(),   nullable=False),
    StructField("customer_id", LongType(),  nullable=False),
    StructField("amount",     DoubleType(), nullable=True),
    StructField("status",     StringType(), nullable=True),
])

def validate_schema(df, expected_schema, label=""):
    actual_fields = {f.name: f.dataType for f in df.schema.fields}
    for field in expected_schema.fields:
        if field.name not in actual_fields:
            raise ValueError(f"[{label}] Missing required column: {field.name}")
        if type(actual_fields[field.name]) != type(field.dataType):
            raise ValueError(
                f"[{label}] Column '{field.name}': "
                f"expected {field.dataType}, got {actual_fields[field.name]}")
    return True
```

---

## Schema Registry Pattern

Track schema versions over time to enable reproducible reprocessing:

```python
import json
from datetime import datetime

def save_schema_version(spark, table_name, schema, version_path):
    schema_record = {
        "table": table_name,
        "version": datetime.now().isoformat(),
        "schema": schema.jsonValue()
    }
    (spark.createDataFrame([schema_record])
        .write.format("delta")
        .mode("append")
        .save(version_path))

def get_schema_at_version(spark, table_name, as_of_version, version_path):
    return (spark.read.format("delta")
        .option("versionAsOf", as_of_version)
        .load(version_path)
        .filter(F.col("table") == table_name)
        .orderBy(F.col("version").desc())
        .first())
```

---

## Common Interview Questions

**Q: What is the difference between schema enforcement and schema evolution in Delta Lake?**  
A: Schema enforcement (default): Delta rejects any write whose schema doesn't match the table schema — prevents silent schema drift. Schema evolution (`mergeSchema=true`): new columns in the source are automatically added to the table schema; old rows get `null` for new columns.

**Q: What is `mergeSchema` vs `overwriteSchema`?**  
A: `mergeSchema=true` adds new columns but keeps existing ones unchanged — safe for normal evolution. `overwriteSchema=true` replaces the entire schema, allowing type changes and column removal — use carefully as it can break downstream consumers.

**Q: What is Column Mapping in Delta Lake and what does it enable?**  
A: Column Mapping decouples the logical column name from the physical Parquet column name. This enables: (1) renaming columns without rewriting data files, (2) dropping columns logically (data stays in Parquet but is hidden), (3) column names with special characters.

**Q: How does Auto Loader handle schema evolution?**  
A: Auto Loader stores the inferred schema in `cloudFiles.schemaLocation`. When a new column appears in source files, it detects the schema change and evolves the target schema automatically (with `addNewColumns` mode). The stream briefly restarts to adopt the new schema.

**Q: What schema changes are supported vs unsupported in Delta?**  
A: Supported: adding columns, renaming columns (with column mapping), dropping columns (with column mapping), type widening (INT→LONG). Not supported without full rewrite: type narrowing (DOUBLE→INT), removing required fields, incompatible type changes. Use `overwriteSchema=true` with a full overwrite for incompatible changes.

---

## Quick Reference

```python
# Add new columns (mergeSchema)
df.write.format("delta").mode("append").option("mergeSchema","true").save("/path")

# Replace schema (overwriteSchema)
df.write.format("delta").mode("overwrite").option("overwriteSchema","true").save("/path")

# Enable column mapping (rename/drop without rewrite)
ALTER TABLE t SET TBLPROPERTIES ('delta.columnMapping.mode' = 'name')
ALTER TABLE t RENAME COLUMN old_name TO new_name
ALTER TABLE t DROP COLUMN col_name

# Type widening
ALTER TABLE t ALTER COLUMN amount TYPE DOUBLE

# Auto Loader schema evolution
.option("cloudFiles.schemaLocation", "/schema/path")
.option("cloudFiles.schemaEvolutionMode", "addNewColumns")   # default
# Options: addNewColumns | failOnNewColumns | rescue

# Validate schema
def validate_schema(df, expected):
    actual = {f.name: type(f.dataType) for f in df.schema.fields}
    for col, dtype in expected.items():
        assert col in actual, f"Missing: {col}"
        assert actual[col] == type(dtype), f"Type mismatch: {col}"
```
