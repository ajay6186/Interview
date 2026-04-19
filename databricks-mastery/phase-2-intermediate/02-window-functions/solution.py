# ============================================================================
# Solution 2.2 — Window Functions
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

spark = SparkSession.builder.appName("window-solution").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

scores = spark.createDataFrame([
    ("Alice","Math",92),("Alice","Science",85),("Alice","English",78),
    ("Bob","Math",75),("Bob","Science",88),("Bob","English",90),
    ("Carol","Math",95),("Carol","Science",91),("Carol","English",87),
    ("Dave","Math",60),("Dave","Science",70),("Dave","English",65),
], ["student","subject","score"])

monthly = spark.createDataFrame([
    ("Alice",1,5000),("Alice",2,5500),("Alice",3,4800),("Alice",4,6000),
    ("Bob",1,4000),("Bob",2,4200),("Bob",3,4100),("Bob",4,4500),
    ("Carol",1,7000),("Carol",2,7500),("Carol",3,6800),("Carol",4,8000),
], ["rep","month","sales"])

# 1. Rank within subject
w_subj = Window.partitionBy("subject").orderBy(F.col("score").desc())
ranked = scores.withColumn("subject_rank", F.rank().over(w_subj))
assert "subject_rank" in ranked.columns

# 2. Top per subject
top_students = ranked.filter(F.col("subject_rank") == 1)
assert top_students.count() == 3

# 3. vs avg
w_subj_all = Window.partitionBy("subject")
vs_avg = scores.withColumn("subj_avg", F.avg("score").over(w_subj_all)) \
               .withColumn("diff", F.col("score") - F.col("subj_avg"))
assert "subj_avg" in vs_avg.columns and "diff" in vs_avg.columns

# 4. Month-over-month
w_chrono = Window.partitionBy("rep").orderBy("month")
mom = monthly.withColumn("prev_sales", F.lag("sales",1).over(w_chrono)) \
             .withColumn("change", F.col("sales") - F.col("prev_sales"))
assert "prev_sales" in mom.columns and "change" in mom.columns

# 5. Cumulative sales
w_running = Window.partitionBy("rep").orderBy("month") \
                  .rowsBetween(Window.unboundedPreceding, Window.currentRow)
cum_sales = monthly.withColumn("cum_sales", F.sum("sales").over(w_running))
assert "cum_sales" in cum_sales.columns

# 6. Rank reps by total
rep_ranked = (monthly.groupBy("rep").agg(F.sum("sales").alias("total_sales"))
                     .withColumn("overall_rank", F.rank().over(Window.orderBy(F.col("total_sales").desc()))))
assert "overall_rank" in rep_ranked.columns
assert rep_ranked.filter(F.col("overall_rank") == 1).first()["rep"] == "Carol"

# 7. Rolling 2-month avg
w_roll = Window.partitionBy("rep").orderBy("month").rowsBetween(-1, 0)
rolling_avg = monthly.withColumn("roll_2m", F.avg("sales").over(w_roll))
assert "roll_2m" in rolling_avg.columns

# 8. Terciles
w_all = Window.orderBy("score")
tercile_df = scores.withColumn("tercile", F.ntile(3).over(w_all))
assert "tercile" in tercile_df.columns

print("All assertions passed!")
spark.stop()
