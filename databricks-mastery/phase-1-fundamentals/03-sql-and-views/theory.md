# Theory: SQL and Views

## Spark SQL Overview
Spark SQL allows you to run standard SQL queries on DataFrames. The query engine (Catalyst optimizer) is shared — whether you use the Python DataFrame API or SQL, the same optimized physical plan is generated. SQL and DataFrame APIs are interchangeable.

---

## Temp Views vs Global Temp Views

| | Temp View | Global Temp View |
|--|-----------|-----------------|
| Scope | Current SparkSession only | All sessions in the same application |
| Namespace | No prefix | `global_temp.view_name` |
| Lifetime | Session lifetime | Application lifetime |
| Create | `createOrReplaceTempView("name")` | `createOrReplaceGlobalTempView("name")` |

```python
df.createOrReplaceTempView("orders")
spark.sql("SELECT * FROM orders WHERE amount > 100")

df.createOrReplaceGlobalTempView("orders_global")
spark.sql("SELECT * FROM global_temp.orders_global")
```

---

## Catalog Tables vs Temp Views

| | Temp View | Catalog Table (Hive/UC) |
|--|-----------|------------------------|
| Persists after restart | ✗ | ✓ |
| Visible to other users | ✗ | ✓ |
| Has physical storage | ✗ | ✓ |
| DDL needed | ✗ | ✓ |

```python
# Register as catalog table (persistent)
df.write.saveAsTable("silver.orders")
spark.sql("SELECT * FROM silver.orders")

# Temp view (session-scoped)
df.createOrReplaceTempView("orders_temp")
```

---

## Spark SQL DDL (on Delta tables)

```sql
-- Create managed table
CREATE TABLE IF NOT EXISTS silver.orders (
    order_id    STRING      NOT NULL,
    customer_id STRING,
    amount      DOUBLE,
    order_date  DATE
) USING DELTA
PARTITIONED BY (order_date);

-- Create table from existing path
CREATE TABLE silver.orders_ext
USING DELTA LOCATION 's3://bucket/silver/orders';

-- Create View
CREATE OR REPLACE VIEW gold.monthly_revenue AS
SELECT DATE_FORMAT(order_date, 'yyyy-MM') AS month,
       SUM(amount) AS revenue
FROM silver.orders
WHERE status = 'completed'
GROUP BY 1;

-- CTAS (Create Table As Select)
CREATE TABLE gold.top_customers
USING DELTA
AS SELECT customer_id, SUM(amount) AS ltv
   FROM silver.orders GROUP BY 1
   HAVING ltv > 1000;

-- ALTER TABLE
ALTER TABLE silver.orders ADD COLUMNS (discount_pct DOUBLE);
ALTER TABLE silver.orders SET TBLPROPERTIES ('delta.autoCompact.enabled'='true');
ALTER TABLE silver.orders ADD CONSTRAINT pos_amount CHECK (amount > 0);

-- DROP
DROP TABLE IF EXISTS dev.test_orders;
DROP VIEW IF EXISTS gold.monthly_revenue;
```

---

## Useful SQL Functions in Spark

```sql
-- Window functions
ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC)
RANK() OVER (...)
DENSE_RANK() OVER (...)
LAG(amount, 1) OVER (ORDER BY order_date)
LEAD(amount, 1) OVER (ORDER BY order_date)
SUM(amount) OVER (PARTITION BY customer_id)

-- Conditional
CASE WHEN amount > 1000 THEN 'high' ELSE 'low' END
COALESCE(promo_code, 'NONE')
NULLIF(status, 'N/A')            -- returns NULL if status='N/A'
IF(amount > 0, amount, 0)

-- Date
DATE_FORMAT(order_date, 'yyyy-MM-dd')
DATEDIFF(end_date, start_date)
DATE_ADD(order_date, 7)
TRUNC(order_date, 'month')

-- String
REGEXP_REPLACE(phone, '[- ]', '')
REGEXP_EXTRACT(email, '@(.+)', 1)
CONCAT_WS('-', year, month, day)
UPPER(name), TRIM(name)

-- Array / Map (from complex types)
EXPLODE(items_array)
SIZE(items_array)
ARRAY_CONTAINS(tags, 'premium')
MAP_KEYS(attributes), MAP_VALUES(attributes)
```

---

## DataFrame API ↔ Spark SQL Equivalence

| DataFrame API | Spark SQL |
|---------------|----------|
| `df.select("a","b")` | `SELECT a, b FROM t` |
| `df.filter(col("x") > 5)` | `WHERE x > 5` |
| `df.groupBy("a").agg(sum("b"))` | `GROUP BY a ... SUM(b)` |
| `df.orderBy("a")` | `ORDER BY a` |
| `df.limit(10)` | `LIMIT 10` |
| `df.join(df2,"id","left")` | `LEFT JOIN t2 ON t.id=t2.id` |
| `df.distinct()` | `SELECT DISTINCT ...` |
| `df.withColumn("x", expr("a+b"))` | `SELECT *, a+b AS x` |

---

## Common Interview Questions

**Q: What is the difference between a temp view and a catalog table?**  
A: A temp view is session-scoped, stored only in memory, and disappears when the session ends. A catalog table is persistent — stored in the Hive metastore or Unity Catalog with actual data files on disk. Other users/sessions can access catalog tables; they cannot access temp views.

**Q: Can you mix SQL and DataFrame API?**  
A: Yes. `df.createOrReplaceTempView("t")` then `spark.sql("SELECT * FROM t")` gives you a DataFrame. Conversely, `spark.table("catalog.schema.table")` gives a DataFrame from a catalog table. The same Catalyst optimizer is used for both paths.

**Q: What is the difference between a View and a materialized table in Spark SQL?**  
A: A View stores the query definition only — it re-executes on every read. A table (e.g., Delta) stores the actual data. Views are always fresh (re-computed from source), but are slower for complex queries. Use tables when: the view query is expensive and results are reused frequently. Use views for: access control (RLS/column masking) and abstraction layers.

**Q: How does `spark.sql()` compare to the DataFrame API in terms of performance?**  
A: Identical — both go through Catalyst optimizer and produce the same physical plan. Choose based on readability: SQL is often cleaner for complex multi-table queries; DataFrame API is better when building queries programmatically.

**Q: What is CTAS (Create Table As Select)?**  
A: CTAS creates a new table from the result of a SELECT query: `CREATE TABLE gold.summary USING DELTA AS SELECT ...`. It materializes the result as a Delta table in one step. Useful for one-time transformations that create permanent gold tables.

---

## Quick Reference

```python
# Register and query
df.createOrReplaceTempView("my_table")
result = spark.sql("""
    SELECT customer_id,
           SUM(amount) AS total,
           COUNT(*) AS orders
    FROM my_table
    WHERE status = 'completed'
    GROUP BY customer_id
    HAVING total > 500
    ORDER BY total DESC
""")

# Catalog operations
spark.catalog.listTables()
spark.catalog.listColumns("silver.orders")
spark.catalog.tableExists("silver.orders")
spark.catalog.dropTempView("my_table")
spark.catalog.clearCache()
```
