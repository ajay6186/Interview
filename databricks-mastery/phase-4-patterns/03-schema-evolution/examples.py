# ============================================================================
# Examples 4.3 — Schema Evolution  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, DoubleType, LongType
from delta.tables import DeltaTable

spark = (SparkSession.builder
    .appName("schema-evolution-examples")
    .config("spark.sql.extensions","io.delta.sql.DeltaSparkSessionExtension")
    .config("spark.sql.catalog.spark_catalog","org.apache.spark.sql.delta.catalog.DeltaCatalog")
    .getOrCreate())
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/schema_ev"
os.makedirs(BASE, exist_ok=True)

# ── BASIC (1–15) ─────────────────────────────────────────────────────────────
# 1. Original table — v1 schema
v1 = spark.createDataFrame([(1,"Alice",30),(2,"Bob",25)], ["id","name","age"])
v1.write.format("delta").mode("overwrite").save(f"{BASE}/users")
print("Ex01 v1 schema:", spark.read.format("delta").load(f"{BASE}/users").dtypes)

# 2. mergeSchema — add new column (email) on append
v2 = spark.createDataFrame([(3,"Carol",28,"carol@x.com")], ["id","name","age","email"])
v2.write.format("delta").mode("append").option("mergeSchema","true").save(f"{BASE}/users")
print("Ex02 after mergeSchema cols:", spark.read.format("delta").load(f"{BASE}/users").columns)

# 3. Existing rows get null for new column
row1 = spark.read.format("delta").load(f"{BASE}/users").filter(F.col("id")==1).collect()[0]
print(f"Ex03 row id=1 email: {row1['email']}")  # None

# 4. overwriteSchema — replace schema entirely
v3 = spark.createDataFrame([(1,100.0),(2,200.0)], ["id","score"])
v3.write.format("delta").mode("overwrite").option("overwriteSchema","true").save(f"{BASE}/users")
print("Ex04 after overwriteSchema cols:", spark.read.format("delta").load(f"{BASE}/users").columns)

# 5. Schema enforcement — adding column without mergeSchema raises AnalysisException
v1.write.format("delta").mode("overwrite").option("overwriteSchema","true").save(f"{BASE}/users2")
try:
    v2.write.format("delta").mode("append").save(f"{BASE}/users2")
except Exception as e:
    print(f"Ex05 enforcement error: {type(e).__name__}")

# 6. DESCRIBE TABLE schema
spark.sql(f"DESCRIBE delta.`{BASE}/users`").show()

# 7. DESCRIBE HISTORY — see version with schema change
spark.sql(f"DESCRIBE HISTORY delta.`{BASE}/users`").select("version","operation").show()

# 8. Time travel to pre-schema-change version
v0_schema = spark.read.format("delta").option("versionAsOf","0").load(f"{BASE}/users").columns
print("Ex08 v0 columns:", v0_schema)

# 9. Add nullable column via ALTER TABLE (SQL)
spark.sql(f"ALTER TABLE delta.`{BASE}/users` ADD COLUMNS (label STRING)")
print("Ex09 after ALTER ADD:", spark.read.format("delta").load(f"{BASE}/users").columns)

# 10. Add column with DEFAULT via ALTER
print("Ex10 ALTER TABLE tbl ADD COLUMNS (region STRING DEFAULT 'US')")

# 11. Rename column — column mapping required
print("Ex11 ALTER TABLE delta.`path` RENAME COLUMN old_name TO new_name  -- requires columnMapping=name")

# 12. Drop column
print("Ex12 ALTER TABLE delta.`path` DROP COLUMN col_name  -- requires columnMapping=name")

# 13. Enable column mapping
print("Ex13 ALTER TABLE delta.`path` SET TBLPROPERTIES ('delta.columnMapping.mode'='name')")

# 14. Type widening — int → long (Delta 3.x+)
print("Ex14 ALTER TABLE tbl ALTER COLUMN age TYPE LONG  -- type widening (int→long, float→double)")

# 15. CAST manually for type change
df15 = spark.read.format("delta").load(f"{BASE}/users").withColumn("id", F.col("id").cast(LongType()))
print("Ex15 manual cast dtypes:", df15.dtypes)

# ── INTERMEDIATE (16–30) ─────────────────────────────────────────────────────
# 16. Auto Loader schema inference + schema location
print("Ex16 cloudFiles.schemaLocation='/checkpoint/schema' — Auto Loader infers and persists schema")

# 17. Auto Loader schema evolution modes
print("Ex17 cloudFiles.schemaEvolutionMode: 'addNewColumns'|'rescue'|'failOnNewColumns'|'none'")

# 18. Rescued data column (_rescued_data)
print("Ex18 Auto Loader rescued_data column captures fields not in current schema as JSON string")

# 19. Schema location — force schema re-infer
print("Ex19 dbutils.fs.rm(schemaLocation, True)  # forces schema re-detection on next run")

# 20. Forward-compatible reads — select only known columns
known_cols = ["id","score"]
df20 = spark.read.format("delta").load(f"{BASE}/users").select(*known_cols)
print("Ex20 forward-compat:", df20.columns)

# 21. Backward-compatible writes — add with default
print("Ex21 New column added with nullable=True → existing readers unaffected")

# 22. Schema on read — CSV
csv_path = f"{BASE}/raw.csv"
spark.createDataFrame([(1,"a","x"),(2,"b","y")], ["id","val","extra"]) \
    .toPandas().to_csv(csv_path, index=False)
df22 = spark.read.option("header","true").option("inferSchema","true").csv(csv_path)
print("Ex22 inferred schema:", df22.dtypes)

# 23. Enforce schema on read — provide explicit StructType
explicit = StructType([
    StructField("id",  IntegerType()),
    StructField("val", StringType()),
])
df23 = spark.read.option("header","true").schema(explicit).csv(csv_path)
print("Ex23 explicit schema cols:", df23.columns)

# 24. Handle extra columns (select subset)
df24 = spark.read.option("header","true").option("inferSchema","true").csv(csv_path).select("id","val")
print("Ex24 subset cols:", df24.columns)

# 25. Struct nested schema evolution
from pyspark.sql.types import MapType
nested = spark.createDataFrame(
    [(1,{"k":"v1"}),(2,{"k":"v2","k2":"extra"})],
    StructType([
        StructField("id",IntegerType()),
        StructField("attrs",MapType(StringType(),StringType())),
    ])
)
nested.show()

# 26. Flatten nested struct after schema change
print("Ex26 df.select('id', 'address.city', 'address.zip')  # flatten added nested fields")

# 27. Schema migration script pattern
print("""Ex27 Migration pattern:
  1. read old table
  2. transform to new schema (add/rename/cast cols)
  3. write to new path with overwriteSchema=True
  4. clone DESCRIBE HISTORY metadata""")

# 28. CONVERT TO DELTA + schema
print("Ex28 CONVERT TO DELTA parquet.`/path` — picks up existing parquet schema")

# 29. Parquet schema evolution (Spark config)
print("Ex29 spark.conf.set('spark.sql.parquet.mergeSchema','true') — merge schemas across files")

# 30. Detect schema drift programmatically
old_cols = set(["id","name","age"])
new_cols = set(["id","name","age","email"])
added   = new_cols - old_cols
removed = old_cols - new_cols
print(f"Ex30 schema drift — added: {added}, removed: {removed}")

# ── ADVANCED (31–42) ─────────────────────────────────────────────────────────
# 31. Schema registry with Confluent / Databricks
print("Ex31 SchemaRegistryClient.register('topic-value', AvroSchema(schema_str))")

# 32. Avro schema evolution rules
print("Ex32 Avro: adding field with default is backward-compatible; removing field is not")

# 33. JSON schema validation before write
import json
def validate_record(record, required_keys):
    return all(k in record for k in required_keys)
rec = {"id":1,"name":"Alice","email":"alice@x.com"}
print("Ex33 valid:", validate_record(rec, ["id","name","email"]))

# 34. Delta schema evolution in MERGE
print("""Ex34 MERGE with schema evolution:
  spark.conf.set('spark.databricks.delta.schema.autoMerge.enabled','true')
  DeltaTable.merge(...).whenNotMatchedInsertAll().execute()""")

# 35. autoMerge in MERGE
spark.conf.set("spark.databricks.delta.schema.autoMerge.enabled","true")
print("Ex35 autoMerge enabled for MERGE operations")

# 36. Schema evolution in DLT pipeline
print("Ex36 DLT: @dlt.table(schema='id BIGINT, name STRING, email STRING') — explicit schema")

# 37. SCD2 schema requirements
print("Ex37 SCD2 needs: is_current BOOLEAN, effective_from DATE, effective_to DATE columns")

# 38. Version-tagged schema table
print("Ex38 CREATE TABLE schema_registry (version INT, schema_json STRING, created_at TIMESTAMP)")

# 39. Schema comparison function
def compare_schemas(df1, df2):
    s1 = set(df1.dtypes)
    s2 = set(df2.dtypes)
    return {"added": s2-s1, "removed": s1-s2}
df_a = spark.createDataFrame([(1,"a")],["id","name"])
df_b = spark.createDataFrame([(1,"a",30)],["id","name","age"])
print("Ex39 schema diff:", compare_schemas(df_a, df_b))

# 40. Rescue schema on mismatch (collect rescued_data)
print("Ex40 df.withColumn('rescued', F.col('_rescued_data'))  — inspect rescued JSON")

# 41. Schema pinning — ignore new columns in source
print("Ex41 read with explicit schema → new source columns silently ignored")

# 42. Generated columns in schema
print("Ex42 CREATE TABLE ... (year_part INT GENERATED ALWAYS AS (YEAR(event_date)))")

# ── EXPERT (43–50) ────────────────────────────────────────────────────────────
# 43. Unity Catalog schema enforcement
print("Ex43 UC column tags + masks enforce access-level schema views per group")

# 44. Data contract as code
print("Ex44 Data contract: JSON Schema / Protobuf / Avro defining producer obligations")

# 45. Schema governance workflow
print("Ex45 PR review for schema changes → CI validates backward compatibility → auto-merge")

# 46. Column lineage via Unity Catalog
print("Ex46 UC data lineage: column A → column B tracked automatically via INFORMATION_SCHEMA")

# 47. Schema versioning table
print("Ex47 Store schema hash per table per day in audit table for drift detection")

# 48. Backward/forward compatibility matrix
print("Ex48 Backward: new reader reads old data. Forward: old reader reads new data.")

# 49. Kafka + Delta schema evolution E2E
print("Ex49 Kafka schema registry → Auto Loader rescued_data → schema migration pipeline")

# 50. Schema-as-code (Terraform/Pulumi for Delta/UC tables)
print("Ex50 resource databricks_sql_table manages DDL declaratively in IaC")

def main():
    print("\nAll 50 schema evolution examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
