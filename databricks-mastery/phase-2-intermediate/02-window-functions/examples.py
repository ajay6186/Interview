# ============================================================================
# Examples 2.2 — Window Functions  (50 examples)
# BASIC (1–15) | INTERMEDIATE (16–30) | ADVANCED (31–42) | EXPERT (43–50)
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

spark = SparkSession.builder.appName("window-functions-examples").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

sales = spark.createDataFrame([
    ("Alice","Engineering","2024-01",12000),("Alice","Engineering","2024-02",15000),
    ("Alice","Engineering","2024-03",11000),("Bob","Marketing","2024-01",8000),
    ("Bob","Marketing","2024-02",9500),("Bob","Marketing","2024-03",7000),
    ("Carol","Engineering","2024-01",18000),("Carol","Engineering","2024-02",20000),
    ("Carol","Engineering","2024-03",17000),("Dave","HR","2024-01",5000),
    ("Dave","HR","2024-02",6000),("Dave","HR","2024-03",5500),
], ["rep","dept","month","amount"])

# ── BASIC ────────────────────────────────────────────────────────────────────

# 1. ROW_NUMBER — unique sequential number within partition
w1 = Window.partitionBy("dept").orderBy(F.col("amount").desc())
sales.withColumn("rn", F.row_number().over(w1)).show()

# 2. RANK — same rank for ties, gaps after ties
sales.withColumn("rnk", F.rank().over(w1)).show()

# 3. DENSE_RANK — same rank for ties, no gaps
sales.withColumn("dr", F.dense_rank().over(w1)).show()

# 4. PERCENT_RANK — relative rank 0.0 to 1.0
sales.withColumn("pct_rank", F.percent_rank().over(w1)).show()

# 5. NTILE — divide rows into n buckets
w_all = Window.orderBy("amount")
sales.withColumn("quartile", F.ntile(4).over(w_all)).show()

# 6. LAG — access previous row value
w_chrono = Window.partitionBy("rep").orderBy("month")
sales.withColumn("prev_amount", F.lag("amount", 1).over(w_chrono)).show()

# 7. LEAD — access next row value
sales.withColumn("next_amount", F.lead("amount", 1).over(w_chrono)).show()

# 8. FIRST_VALUE over window
sales.withColumn("first_sale", F.first("amount").over(w_chrono)).show()

# 9. LAST_VALUE over window
w_full = Window.partitionBy("rep").orderBy("month") \
               .rowsBetween(Window.unboundedPreceding, Window.unboundedFollowing)
sales.withColumn("last_sale", F.last("amount").over(w_full)).show()

# 10. SUM as running total
w_running = Window.partitionBy("rep").orderBy("month") \
                  .rowsBetween(Window.unboundedPreceding, Window.currentRow)
sales.withColumn("cum_sales", F.sum("amount").over(w_running)).show()

# 11. AVG over rolling window (preceding 1 row to current)
w_roll = Window.partitionBy("rep").orderBy("month") \
               .rowsBetween(-1, 0)
sales.withColumn("rolling_avg", F.avg("amount").over(w_roll)).show()

# 12. MAX over expanding window
sales.withColumn("max_so_far", F.max("amount").over(w_running)).show()

# 13. COUNT over window
sales.withColumn("months_so_far", F.count("amount").over(w_running)).show()

# 14. Window without PARTITION BY (global window)
w_global = Window.orderBy("amount")
sales.withColumn("global_rank", F.rank().over(w_global)).show()

# 15. Filter top 1 per partition (top-N pattern)
sales.withColumn("rn", F.row_number().over(w1)) \
     .filter(F.col("rn") == 1) \
     .drop("rn") \
     .show()

# ── INTERMEDIATE ─────────────────────────────────────────────────────────────

# 16. Month-over-month change
sales.withColumn("prev", F.lag("amount",1).over(w_chrono)) \
     .withColumn("mom_change", F.col("amount") - F.col("prev")) \
     .show()

# 17. Month-over-month % change
sales.withColumn("prev", F.lag("amount",1).over(w_chrono)) \
     .withColumn("mom_pct", F.round((F.col("amount") - F.col("prev")) / F.col("prev") * 100, 2)) \
     .show()

# 18. Rolling 3-month sum
w_3m = Window.partitionBy("rep").orderBy("month").rowsBetween(-2, 0)
sales.withColumn("rolling_3m", F.sum("amount").over(w_3m)).show()

# 19. Rank vs Dense Rank difference
tie_data = spark.createDataFrame([
    ("A",100),("B",100),("C",90),("D",80)
], ["name","score"])
w_tie = Window.orderBy(F.col("score").desc())
tie_data.withColumn("rank", F.rank().over(w_tie)) \
        .withColumn("dense_rank", F.dense_rank().over(w_tie)) \
        .show()

# 20. Partition by multiple columns
w_multi = Window.partitionBy("dept","month").orderBy(F.col("amount").desc())
sales.withColumn("rank_in_dept_month", F.rank().over(w_multi)).show()

# 21. Conditional first_value (ignoreNulls)
df_nulls = spark.createDataFrame([
    ("A","Jan",None),("A","Feb",100),("A","Mar",200),
], ["rep","month","amount"])
w_n = Window.partitionBy("rep").orderBy("month")
df_nulls.withColumn("first_non_null",
    F.first("amount", ignorenulls=True).over(w_n)).show()

# 22. CUME_DIST — cumulative distribution
sales.withColumn("cume_dist", F.cume_dist().over(w_all)).show()

# 23. Window with range frame (value-based, not row-based)
# rowsBetween uses row offsets; rangeBetween uses value offsets
w_range = Window.orderBy("amount").rangeBetween(-1000, 1000)
sales.withColumn("nearby_sum", F.sum("amount").over(w_range)).show()

# 24. Moving average with rangeBetween
sales.withColumn("amt_f",F.col("amount").cast("double")) \
     .withColumn("mov_avg", F.avg("amt_f").over(w_roll)).show()

# 25. Lead with default value
sales.withColumn("next_amount_default",
    F.lead("amount", 1, 0).over(w_chrono)).show()

# 26. Lag with offset > 1
sales.withColumn("two_months_ago",
    F.lag("amount", 2, 0).over(w_chrono)).show()

# 27. Min salary window vs groupBy
from pyspark.sql.window import Window as W
sales.withColumn("dept_min", F.min("amount").over(Window.partitionBy("dept"))).show()

# 28. Identify records above dept average
w_dept = Window.partitionBy("dept")
sales.withColumn("dept_avg", F.avg("amount").over(w_dept)) \
     .withColumn("above_avg", F.col("amount") > F.col("dept_avg")) \
     .show()

# 29. Running total then filter last row per rep (latest cumulative)
sales.withColumn("cum", F.sum("amount").over(w_running)) \
     .withColumn("rn_desc", F.row_number().over(
         Window.partitionBy("rep").orderBy(F.col("month").desc()))) \
     .filter(F.col("rn_desc") == 1) \
     .select("rep","cum") \
     .show()

# 30. Sessionization — detect gaps and assign session IDs
events = spark.createDataFrame([
    ("user1","10:00",1),("user1","10:05",2),("user1","10:30",3),
    ("user1","11:00",4),("user2","09:00",1),
], ["user","time","event_id"])
w_ev = Window.partitionBy("user").orderBy("event_id")
events.withColumn("prev_time", F.lag("time",1).over(w_ev)) \
      .withColumn("new_session",
         F.when(F.col("prev_time").isNull(), 1)
          .when(F.col("time") > "10:20", 1)  # simplified gap detection
          .otherwise(0)) \
      .withColumn("session_id", F.sum("new_session").over(w_ev)) \
      .show()

# ── ADVANCED ─────────────────────────────────────────────────────────────────

# 31. Top-N per group (N=2)
sales.withColumn("rn", F.row_number().over(w1)) \
     .filter(F.col("rn") <= 2) \
     .show()

# 32. Median via percentile_approx in window
sales.withColumn("dept_median",
    F.percentile_approx("amount", 0.5).over(Window.partitionBy("dept"))).show()

# 33. Window frame with UNBOUNDED FOLLOWING
w_suffix = Window.partitionBy("rep").orderBy("month") \
                 .rowsBetween(Window.currentRow, Window.unboundedFollowing)
sales.withColumn("remaining_sales", F.sum("amount").over(w_suffix)).show()

# 34. Detect consecutive same value (island detection)
streak = spark.createDataFrame([
    (1,"A"),(2,"A"),(3,"B"),(4,"A"),(5,"A"),(6,"A")
], ["id","val"])
w_s = Window.orderBy("id")
streak.withColumn("prev_val", F.lag("val",1).over(w_s)) \
      .withColumn("new_group", F.when(F.col("val") != F.col("prev_val"), 1).otherwise(0)) \
      .withColumn("group_id", F.sum("new_group").over(w_s)) \
      .show()

# 35. Calculating STDDEV in a window
sales.withColumn("dept_stddev",
    F.stddev("amount").over(Window.partitionBy("dept"))).show()

# 36. Exponential moving average (manual via lag)
alpha = 0.3
sales_ema = sales.withColumn("prev", F.lag("amount",1).over(w_chrono)) \
                 .withColumn("ema", F.when(F.col("prev").isNull(), F.col("amount"))
                                     .otherwise(F.col("prev") * (1-alpha) + F.col("amount") * alpha))
sales_ema.show()

# 37. NTILE quartile then agg
sales.withColumn("quartile", F.ntile(4).over(Window.partitionBy("dept").orderBy("amount"))) \
     .groupBy("dept","quartile").agg(F.avg("amount")).show()

# 38. Conditional window (only sum positive changes)
sales.withColumn("prev", F.lag("amount",1,0).over(w_chrono)) \
     .withColumn("gain", F.when(F.col("amount") > F.col("prev"), F.col("amount") - F.col("prev")).otherwise(0)) \
     .withColumn("cum_gain", F.sum("gain").over(w_running)) \
     .show()

# 39. Combine window with filter then re-window
top_reps = sales.withColumn("total", F.sum("amount").over(Window.partitionBy("rep"))) \
                .filter(F.col("total") > 30000) \
                .select("rep").distinct()
print("Ex39 top reps:", [r["rep"] for r in top_reps.collect()])

# 40. Overlapping rolling windows comparison
w_1m = Window.partitionBy("rep").orderBy("month").rowsBetween(0, 0)
w_3m_back = Window.partitionBy("rep").orderBy("month").rowsBetween(-2, 0)
sales.withColumn("current", F.sum("amount").over(w_1m)) \
     .withColumn("rolling_3m", F.sum("amount").over(w_3m_back)) \
     .show()

# 41. Detect first and last month per rep
sales.withColumn("first_month", F.first("month").over(Window.partitionBy("rep").orderBy("month"))) \
     .withColumn("last_month",  F.last("month").over(
         Window.partitionBy("rep").orderBy("month")
               .rowsBetween(Window.unboundedPreceding, Window.unboundedFollowing))) \
     .select("rep","first_month","last_month").distinct().show()

# 42. Cumulative % of total
w_total = Window.partitionBy("rep")
sales.withColumn("total", F.sum("amount").over(w_total)) \
     .withColumn("cum", F.sum("amount").over(w_running)) \
     .withColumn("cum_pct", F.round(F.col("cum") / F.col("total") * 100, 1)) \
     .show()

# ── EXPERT ───────────────────────────────────────────────────────────────────

# 43. Window with SQL
sales.createOrReplaceTempView("sales")
spark.sql("""
    SELECT rep, dept, month, amount,
           SUM(amount) OVER (PARTITION BY rep ORDER BY month
               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_sales
    FROM sales
""").show()

# 44. QUALIFY to filter window result (Databricks SQL)
spark.sql("""
    SELECT rep, dept, month, amount,
           ROW_NUMBER() OVER (PARTITION BY dept ORDER BY amount DESC) AS rn
    FROM sales
    QUALIFY rn = 1
""").show()

# 45. Multiple independent window specs in one SELECT
spark.sql("""
    SELECT rep, month, amount,
           AVG(amount) OVER (PARTITION BY rep)   AS rep_avg,
           AVG(amount) OVER (PARTITION BY dept)  AS dept_avg,
           RANK() OVER (ORDER BY amount DESC)     AS global_rank
    FROM sales
""").show()

# 46. Window function on aggregated result (nested)
agg = sales.groupBy("rep","dept").agg(F.sum("amount").alias("total"))
agg.withColumn("dept_rank", F.rank().over(Window.partitionBy("dept").orderBy(F.col("total").desc()))).show()

# 47. Performance: partition-aware window avoids full shuffle
# Partitioning data by the window partition key before computing avoids re-shuffle
sales_repart = sales.repartition(F.col("dept"))
sales_repart.withColumn("rn", F.row_number().over(w1)).explain()

# 48. Window with custom ordering expression
sales.withColumn("rank_abs",
    F.rank().over(Window.orderBy(F.abs(F.col("amount") - 10000)))).show()

# 49. Reconstruct time-series gaps with window
# Detect where a month is missing (simplified)
sales.withColumn("expected_next",
    F.lead("month", 1).over(w_chrono)) \
    .withColumn("has_gap",
        F.when(F.col("expected_next").isNull(), False)
         .otherwise(F.col("month") == F.col("expected_next"))) \
    .show()

# 50. Merge window results back with original for reporting
w_r = Window.partitionBy("rep")
w_rch = Window.partitionBy("rep").orderBy("month").rowsBetween(Window.unboundedPreceding, Window.currentRow)
sales \
    .withColumn("rep_total",  F.sum("amount").over(w_r)) \
    .withColumn("cum_amount", F.sum("amount").over(w_rch)) \
    .withColumn("pct_complete", F.round(F.col("cum_amount")/F.col("rep_total")*100,1)) \
    .withColumn("month_rank",  F.row_number().over(Window.partitionBy("rep").orderBy("month"))) \
    .show()


def main():
    print("\nAll 50 examples ran successfully.")
    spark.stop()

if __name__ == "__main__":
    main()
