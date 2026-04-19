# ============================================================================
# Examples 1.3 — Spark SQL and Views  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("sql-views-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

employees = spark.createDataFrame([
    (1,"Alice","Engineering",95000,5),(2,"Bob","Marketing",72000,3),
    (3,"Carol","Engineering",105000,8),(4,"Dave","Marketing",68000,2),
    (5,"Eve","Engineering",88000,4),(6,"Frank","HR",60000,1),
], ["id","name","dept","salary","yoe"])

orders = spark.createDataFrame([
    (101,1,500.0),(102,2,300.0),(103,1,750.0),(104,3,1200.0),(105,2,150.0)
], ["order_id","emp_id","amount"])

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. createOrReplaceTempView
employees.createOrReplaceTempView("emp")
orders.createOrReplaceTempView("ord")

# 2. Basic SELECT
spark.sql("SELECT * FROM emp").show()

# 3. WHERE clause
spark.sql("SELECT name, salary FROM emp WHERE dept = 'Engineering'").show()

# 4. ORDER BY
spark.sql("SELECT name, salary FROM emp ORDER BY salary DESC").show()

# 5. LIMIT
spark.sql("SELECT * FROM emp LIMIT 3").show()

# 6. COUNT
spark.sql("SELECT COUNT(*) as total FROM emp").show()

# 7. GROUP BY + aggregate
spark.sql("SELECT dept, COUNT(*) as cnt, AVG(salary) as avg_sal FROM emp GROUP BY dept").show()

# 8. HAVING
spark.sql("SELECT dept, AVG(salary) as avg_sal FROM emp GROUP BY dept HAVING avg_sal > 75000").show()

# 9. DISTINCT
spark.sql("SELECT DISTINCT dept FROM emp").show()

# 10. Aliases
spark.sql("SELECT name AS employee_name, salary * 0.1 AS bonus FROM emp").show()

# 11. BETWEEN
spark.sql("SELECT * FROM emp WHERE salary BETWEEN 70000 AND 100000").show()

# 12. IN operator
spark.sql("SELECT * FROM emp WHERE dept IN ('Engineering','HR')").show()

# 13. LIKE
spark.sql("SELECT * FROM emp WHERE name LIKE 'A%'").show()

# 14. IS NULL / IS NOT NULL
spark.sql("SELECT * FROM emp WHERE salary IS NOT NULL").show()

# 15. String functions in SQL
spark.sql("SELECT UPPER(name), LENGTH(name) FROM emp").show()

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. INNER JOIN
spark.sql("""
    SELECT e.name, e.dept, o.order_id, o.amount
    FROM emp e
    INNER JOIN ord o ON e.id = o.emp_id
""").show()

# 17. LEFT JOIN
spark.sql("""
    SELECT e.name, o.order_id, o.amount
    FROM emp e
    LEFT JOIN ord o ON e.id = o.emp_id
""").show()

# 18. Subquery in WHERE
spark.sql("""
    SELECT * FROM emp
    WHERE salary > (SELECT AVG(salary) FROM emp)
""").show()

# 19. Subquery in FROM (derived table)
spark.sql("""
    SELECT dept, avg_sal
    FROM (SELECT dept, AVG(salary) AS avg_sal FROM emp GROUP BY dept) t
    WHERE avg_sal > 70000
""").show()

# 20. CASE WHEN
spark.sql("""
    SELECT name, salary,
           CASE WHEN yoe >= 7 THEN 'Senior'
                WHEN yoe >= 3 THEN 'Mid'
                ELSE 'Junior' END AS level
    FROM emp
""").show()

# 21. Window function ROW_NUMBER
spark.sql("""
    SELECT name, dept, salary,
           ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) as rn
    FROM emp
""").show()

# 22. Window function RANK
spark.sql("""
    SELECT name, dept, salary,
           RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rnk
    FROM emp
""").show()

# 23. Window function SUM (running total)
spark.sql("""
    SELECT name, dept, salary,
           SUM(salary) OVER (PARTITION BY dept ORDER BY salary) as running_total
    FROM emp
""").show()

# 24. Window LAG/LEAD
spark.sql("""
    SELECT name, salary,
           LAG(salary, 1) OVER (ORDER BY salary) as prev_salary,
           LEAD(salary, 1) OVER (ORDER BY salary) as next_salary
    FROM emp
""").show()

# 25. WITH clause (CTE)
spark.sql("""
    WITH dept_avg AS (
        SELECT dept, AVG(salary) AS avg_sal FROM emp GROUP BY dept
    )
    SELECT e.name, e.salary, d.avg_sal
    FROM emp e
    JOIN dept_avg d ON e.dept = d.dept
""").show()

# 26. Multiple CTEs
spark.sql("""
    WITH
    top_earners AS (SELECT * FROM emp WHERE salary > 90000),
    dept_count  AS (SELECT dept, COUNT(*) AS cnt FROM emp GROUP BY dept)
    SELECT t.name, t.salary, d.cnt
    FROM top_earners t
    JOIN dept_count d ON t.dept = d.dept
""").show()

# 27. UNION ALL
spark.sql("""
    SELECT name, 'high' AS tier FROM emp WHERE salary > 90000
    UNION ALL
    SELECT name, 'low'  AS tier FROM emp WHERE salary <= 70000
""").show()

# 28. Date functions in SQL
spark.sql("SELECT CURRENT_DATE(), CURRENT_TIMESTAMP()").show()

# 29. COALESCE in SQL
spark.sql("SELECT name, COALESCE(NULL, salary, 0) as sal FROM emp").show()

# 30. PIVOT-style with conditional agg
spark.sql("""
    SELECT dept,
           SUM(CASE WHEN yoe >= 5 THEN salary ELSE 0 END) AS senior_payroll,
           SUM(CASE WHEN yoe < 5  THEN salary ELSE 0 END) AS junior_payroll
    FROM emp
    GROUP BY dept
""").show()

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. createGlobalTempView (accessible across sessions)
employees.createGlobalTempView("global_emp")
spark.sql("SELECT * FROM global_temp.global_emp LIMIT 2").show()

# 32. spark.catalog.listTables()
tables = spark.catalog.listTables()
print("Ex32 tables:", [t.name for t in tables])

# 33. spark.catalog.listColumns()
cols = spark.catalog.listColumns("emp")
print("Ex33 columns:", [c.name for c in cols])

# 34. spark.catalog.tableExists()
print("Ex34 emp exists:", spark.catalog.tableExists("emp"))

# 35. spark.catalog.dropTempView()
spark.catalog.dropTempView("emp")
print("Ex35 after drop, emp exists:", spark.catalog.tableExists("emp"))
employees.createOrReplaceTempView("emp")  # re-register

# 36. EXPLAIN in SQL
spark.sql("EXPLAIN SELECT * FROM emp WHERE salary > 80000").show(truncate=False)

# 37. Inline view / derived table with window
spark.sql("""
    SELECT * FROM (
        SELECT name, dept, salary,
               DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC) AS dr
        FROM emp
    ) t WHERE dr = 1
""").show()

# 38. LATERAL VIEW EXPLODE
df_skills = spark.createDataFrame([
    (1, "Alice", ["Python","Spark","SQL"]),
    (2, "Bob",   ["Excel","SQL"]),
], ["id","name","skills"])
df_skills.createOrReplaceTempView("skills_tbl")
spark.sql("SELECT id, name, skill FROM skills_tbl LATERAL VIEW EXPLODE(skills) t AS skill").show()

# 39. COLLECT_LIST in SQL
spark.sql("SELECT dept, COLLECT_LIST(name) as members FROM emp GROUP BY dept").show()

# 40. PERCENTILE_APPROX
spark.sql("SELECT dept, PERCENTILE_APPROX(salary, 0.5) as median_sal FROM emp GROUP BY dept").show()

# 41. ROLLUP
spark.sql("SELECT dept, COUNT(*) as cnt FROM emp GROUP BY ROLLUP(dept)").show()

# 42. CUBE
spark.sql("SELECT dept, yoe, AVG(salary) FROM emp GROUP BY CUBE(dept, yoe)").show()

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Named struct in SQL
spark.sql("SELECT name, STRUCT(salary, yoe) as emp_info FROM emp").show()

# 44. Higher-order functions in SQL (TRANSFORM)
spark.sql("SELECT name, TRANSFORM(skills, s -> UPPER(s)) as upper_skills FROM skills_tbl").show()

# 45. FILTER array in SQL
spark.sql("SELECT name, FILTER(skills, s -> s != 'SQL') as non_sql FROM skills_tbl").show()

# 46. MAP_KEYS / MAP_VALUES
df_map = spark.createDataFrame([(1, {"a":1, "b":2}),], ["id","m"])
df_map.createOrReplaceTempView("map_tbl")
spark.sql("SELECT id, MAP_KEYS(m), MAP_VALUES(m) FROM map_tbl").show()

# 47. AGGREGATE function
spark.sql("SELECT name, AGGREGATE(skills, 0, (acc, s) -> acc + 1) as skill_count FROM skills_tbl").show()

# 48. EXISTS subquery
spark.sql("""
    SELECT name FROM emp e
    WHERE EXISTS (SELECT 1 FROM ord o WHERE o.emp_id = e.id)
""").show()

# 49. Correlated subquery
spark.sql("""
    SELECT name, salary, dept
    FROM emp e1
    WHERE salary > (SELECT AVG(salary) FROM emp e2 WHERE e2.dept = e1.dept)
""").show()

# 50. QUALIFY (Databricks SQL: filter on window functions)
# Note: QUALIFY is Databricks/Snowflake syntax
spark.sql("""
    SELECT name, dept, salary,
           ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC) AS rn
    FROM emp
    QUALIFY rn = 1
""").show()


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
