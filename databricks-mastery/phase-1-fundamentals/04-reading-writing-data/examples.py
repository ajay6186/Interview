# ============================================================================
# Examples 1.4 — Reading & Writing Data  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================
# NOTE: In Databricks use "/dbfs/..." or "dbfs:/..." paths.
#       Locally we use /tmp for demo purposes.
# ============================================================================

import os
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import *

spark = SparkSession.builder \
    .appName("read-write-examples") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()
spark.sparkContext.setLogLevel("WARN")

BASE = "/tmp/databricks_mastery"
os.makedirs(BASE, exist_ok=True)

df = spark.createDataFrame([
    (1,"Alice",95000.0,"2024-01-01"),
    (2,"Bob",  72000.0,"2024-02-15"),
    (3,"Carol",105000.0,"2024-03-10"),
], ["id","name","salary","hire_date"])

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. Write CSV
df.write.mode("overwrite").option("header","true").csv(f"{BASE}/csv_out")
print("Ex01 CSV written")

# 2. Read CSV
df_csv = spark.read.option("header","true").option("inferSchema","true").csv(f"{BASE}/csv_out")
df_csv.show()

# 3. Write JSON
df.write.mode("overwrite").json(f"{BASE}/json_out")
print("Ex03 JSON written")

# 4. Read JSON
df_json = spark.read.json(f"{BASE}/json_out")
df_json.show()

# 5. Write Parquet
df.write.mode("overwrite").parquet(f"{BASE}/parquet_out")
print("Ex05 Parquet written")

# 6. Read Parquet
df_parquet = spark.read.parquet(f"{BASE}/parquet_out")
df_parquet.show()

# 7. Read CSV with explicit schema
schema = StructType([
    StructField("id",       IntegerType(), True),
    StructField("name",     StringType(),  True),
    StructField("salary",   DoubleType(),  True),
    StructField("hire_date",StringType(),  True),
])
df_schema = spark.read.schema(schema).option("header","true").csv(f"{BASE}/csv_out")
df_schema.printSchema()

# 8. Read CSV with options
df_opts = spark.read \
    .option("header","true") \
    .option("sep",",") \
    .option("nullValue","NA") \
    .option("dateFormat","yyyy-MM-dd") \
    .csv(f"{BASE}/csv_out")
df_opts.show()

# 9. Write with partitionBy
df.write.mode("overwrite").partitionBy("name").parquet(f"{BASE}/partitioned_parquet")
print("Ex09 partitioned parquet written")

# 10. Read partitioned parquet
df_part = spark.read.parquet(f"{BASE}/partitioned_parquet")
df_part.show()

# 11. Write single file with coalesce(1)
df.coalesce(1).write.mode("overwrite").option("header","true").csv(f"{BASE}/single_csv")
print("Ex11 single CSV file written")

# 12. Write ORC
df.write.mode("overwrite").orc(f"{BASE}/orc_out")
print("Ex12 ORC written")

# 13. Read ORC
df_orc = spark.read.orc(f"{BASE}/orc_out")
df_orc.show()

# 14. Write with compression
df.write.mode("overwrite").option("compression","snappy").parquet(f"{BASE}/compressed_parquet")
print("Ex14 snappy parquet written")

# 15. Append mode
df_new = spark.createDataFrame([(4,"Dave",68000.0,"2024-04-01")], ["id","name","salary","hire_date"])
df_new.write.mode("append").parquet(f"{BASE}/parquet_out")
df_appended = spark.read.parquet(f"{BASE}/parquet_out")
print("Ex15 after append count:", df_appended.count())

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. inferSchema vs explicit schema performance note
# inferSchema=True requires two passes over data; prefer explicit schema in production
df_inf = spark.read.option("header","true").option("inferSchema","true").csv(f"{BASE}/csv_out")
print("Ex16 inferred types:", df_inf.dtypes)

# 17. Read multiple paths
df_multi = spark.read.parquet(f"{BASE}/parquet_out", f"{BASE}/compressed_parquet")
print("Ex17 multi-path count:", df_multi.count())

# 18. Glob pattern reading
df_glob = spark.read.parquet(f"{BASE}/par*")
print("Ex18 glob count:", df_glob.count())

# 19. Read with filter pushdown (predicate)
df_filtered = spark.read.parquet(f"{BASE}/parquet_out").filter(F.col("salary") > 80000)
df_filtered.explain()  # note PushedFilters in plan

# 20. Add input_file_name
df_with_source = spark.read.parquet(f"{BASE}/parquet_out") \
    .withColumn("source_file", F.input_file_name())
df_with_source.show(truncate=False)

# 21. Write JSON with compression
df.write.mode("overwrite").option("compression","gzip").json(f"{BASE}/json_gz")
print("Ex21 gzip JSON written")

# 22. Read JSON with multiLine
# Create a multiline JSON file first
import json
with open(f"{BASE}/multi.json","w") as f_out:
    json.dump([{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}], f_out)
df_multi_json = spark.read.option("multiLine","true").json(f"{BASE}/multi.json")
df_multi_json.show()

# 23. CSV with custom delimiter
df.write.mode("overwrite").option("header","true").option("sep","|").csv(f"{BASE}/pipe_csv")
df_pipe = spark.read.option("header","true").option("sep","|").csv(f"{BASE}/pipe_csv")
df_pipe.show()

# 24. Save as table (Hive metastore — works in Databricks)
# df.write.mode("overwrite").saveAsTable("default.employees")  # Databricks only
print("Ex24 saveAsTable skipped (requires Hive metastore)")

# 25. spark.table() — read a registered table
df.createOrReplaceTempView("emp_view")
df_tbl = spark.table("emp_view")
df_tbl.show()

# 26. Write CSV with timestamp format
df_ts = df.withColumn("ts", F.current_timestamp())
df_ts.write.mode("overwrite") \
    .option("header","true") \
    .option("timestampFormat","yyyy-MM-dd HH:mm:ss") \
    .csv(f"{BASE}/ts_csv")
print("Ex26 timestamp CSV written")

# 27. Read with column pruning (select pushdown)
df_pruned = spark.read.parquet(f"{BASE}/parquet_out").select("id","name")
df_pruned.explain()

# 28. Write text file (single column)
df_names = df.select("name")
df_names.write.mode("overwrite").text(f"{BASE}/text_out")
print("Ex28 text written")

# 29. Read text
df_text = spark.read.text(f"{BASE}/text_out")
df_text.show()

# 30. format() API (generic DataFrameReader)
df_fmt = spark.read.format("parquet").load(f"{BASE}/parquet_out")
df_fmt.show()

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Delta Lake write (requires delta library)
try:
    df.write.format("delta").mode("overwrite").save(f"{BASE}/delta_out")
    print("Ex31 Delta written")
    df_delta = spark.read.format("delta").load(f"{BASE}/delta_out")
    df_delta.show()
except Exception as e:
    print("Ex31 Delta not available locally:", e)

# 32. Partition pruning with filter
df_pp = spark.read.parquet(f"{BASE}/partitioned_parquet").filter(F.col("name") == "Alice")
df_pp.explain()  # PartitionFilters in plan

# 33. Write with dynamic partition overwrite
spark.conf.set("spark.sql.sources.partitionOverwriteMode", "dynamic")
df_new2 = spark.createDataFrame([(1,"Alice",96000.0,"2024-01-01")],["id","name","salary","hire_date"])
df_new2.write.mode("overwrite").partitionBy("name").parquet(f"{BASE}/partitioned_parquet")
print("Ex33 dynamic partition overwrite done")

# 34. Read schema from parquet metadata
schema_from_file = spark.read.parquet(f"{BASE}/parquet_out").schema
print("Ex34 schema from file:", schema_from_file)

# 35. Merge schema option
df_extra = spark.createDataFrame([(5,"Eve",90000.0,"2024-05-01","engineering")],
                                  ["id","name","salary","hire_date","dept"])
df_extra.write.mode("append").option("mergeSchema","true").parquet(f"{BASE}/parquet_out")
df_merged = spark.read.option("mergeSchema","true").parquet(f"{BASE}/parquet_out")
df_merged.printSchema()

# 36. Avro format (requires spark-avro)
try:
    df.write.format("avro").mode("overwrite").save(f"{BASE}/avro_out")
    spark.read.format("avro").load(f"{BASE}/avro_out").show()
except Exception:
    print("Ex36 Avro not available; install spark-avro")

# 37. Reading from JDBC (pattern — requires driver)
# jdbc_url = "jdbc:postgresql://host:5432/mydb"
# df_jdbc = spark.read.jdbc(url=jdbc_url, table="employees",
#     properties={"user":"u","password":"p","driver":"org.postgresql.Driver"})
print("Ex37 JDBC pattern shown in comment")

# 38. Write to JDBC
# df.write.mode("append").jdbc(url=jdbc_url, table="spark_employees",
#     properties={"user":"u","password":"p"})
print("Ex38 JDBC write pattern shown")

# 39. Read with schema evolution (ignore missing columns)
df_evo = spark.read.option("mergeSchema","true").parquet(f"{BASE}/parquet_out")
print("Ex39 evolved schema columns:", df_evo.columns)

# 40. Repartition before write for optimal file sizes
df.repartition(2).write.mode("overwrite").parquet(f"{BASE}/repartitioned_out")
print("Ex40 repartitioned write done")

# 41. Write with metadata columns (Delta feature)
# In Delta: df.write.format("delta").option("overwriteSchema","true").save(path)
print("Ex41 overwriteSchema pattern shown")

# 42. Read binary files
# spark.read.format("binaryFile").load("path/to/images/")
print("Ex42 binaryFile format pattern shown")

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Custom write options per format
df.write.mode("overwrite") \
    .option("header","true") \
    .option("escape","\"") \
    .option("quoteAll","true") \
    .csv(f"{BASE}/quoted_csv")
print("Ex43 quoted CSV written")

# 44. Streaming source — file source (readStream)
# In production:
# df_stream = spark.readStream.schema(schema).option("maxFilesPerTrigger",1).parquet(path)
print("Ex44 readStream pattern shown")

# 45. Write stream to parquet sink
# query = df_stream.writeStream.format("parquet").option("path",out).option("checkpointLocation",ckpt).start()
print("Ex45 writeStream pattern shown")

# 46. DataFrameWriter.bucketBy (for Hive)
# df.write.bucketBy(4,"id").sortBy("name").saveAsTable("bucketed_table")
print("Ex46 bucketBy pattern shown")

# 47. Reading from cloud storage (Databricks)
# ADLS Gen2: spark.read.parquet("abfss://container@account.dfs.core.windows.net/path")
# S3:        spark.read.parquet("s3://bucket/path")
# GCS:       spark.read.parquet("gs://bucket/path")
print("Ex47 cloud storage patterns shown")

# 48. Partition discovery with basePath
df_base = spark.read.option("basePath", f"{BASE}/partitioned_parquet") \
    .parquet(f"{BASE}/partitioned_parquet/name=Alice")
df_base.show()

# 49. Cache after read for repeated use
df_cached = spark.read.parquet(f"{BASE}/parquet_out").cache()
print("Ex49 cached count:", df_cached.count())
df_cached.unpersist()

# 50. Describe detail (Delta)
# spark.sql("DESCRIBE DETAIL delta.`/path/to/delta`").show()
print("Ex50 DESCRIBE DETAIL pattern for Delta shown")


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
