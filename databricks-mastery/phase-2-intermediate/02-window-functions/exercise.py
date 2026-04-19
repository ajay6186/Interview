# ============================================================================
# Exercise 2.2 — Window Functions
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window

spark = SparkSession.builder.appName("window-exercise").getOrCreate()
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

# ---------------------------------------------------------------------------
# 1. Rank students within each subject by score DESC (use RANK)
# ---------------------------------------------------------------------------
# TODO: ranked = scores with column "subject_rank" (RANK OVER partitionBy subject, orderBy score desc)
ranked = None  # replace None

assert "subject_rank" in ranked.columns

# ---------------------------------------------------------------------------
# 2. Top student per subject (rank == 1)
# ---------------------------------------------------------------------------
# TODO: top_students = filter ranked where subject_rank == 1
top_students = None  # replace None

assert top_students.count() == 3

# ---------------------------------------------------------------------------
# 3. Student's score vs subject average
# ---------------------------------------------------------------------------
# TODO: vs_avg = scores with columns "subj_avg" (AVG OVER subject) and "diff" (score - subj_avg)
vs_avg = None  # replace None

assert "subj_avg" in vs_avg.columns
assert "diff" in vs_avg.columns

# ---------------------------------------------------------------------------
# 4. Month-over-month sales change per rep
# ---------------------------------------------------------------------------
# TODO: mom = monthly with columns "prev_sales" (LAG 1) and "change" (sales - prev_sales)
mom = None  # replace None

assert "prev_sales" in mom.columns
assert "change" in mom.columns

# ---------------------------------------------------------------------------
# 5. Cumulative sales per rep ordered by month
# ---------------------------------------------------------------------------
# TODO: cum_sales = monthly with column "cum_sales" (SUM OVER partitionBy rep, orderBy month, rows unbounded prec to current)
cum_sales = None  # replace None

assert "cum_sales" in cum_sales.columns

# ---------------------------------------------------------------------------
# 6. Rank reps by total 4-month sales using window on aggregated result
# ---------------------------------------------------------------------------
# TODO:
#   Step 1: groupBy rep, sum sales alias "total_sales"
#   Step 2: add "overall_rank" = RANK() OVER (orderBy total_sales desc)
rep_ranked = None  # replace None

assert "overall_rank" in rep_ranked.columns
top_rep = rep_ranked.filter(F.col("overall_rank") == 1).first()["rep"]
assert top_rep == "Carol"

# ---------------------------------------------------------------------------
# 7. Rolling 2-month average per rep
# ---------------------------------------------------------------------------
# TODO: rolling_avg = monthly with "roll_2m" = AVG OVER (partitionBy rep, orderBy month, rows -1 to 0)
rolling_avg = None  # replace None

assert "roll_2m" in rolling_avg.columns

# ---------------------------------------------------------------------------
# 8. NTILE 3 (terciles) for scores globally ordered by score
# ---------------------------------------------------------------------------
# TODO: tercile_df = scores with "tercile" column (NTILE(3) OVER orderBy score)
tercile_df = None  # replace None

assert "tercile" in tercile_df.columns

print("All assertions passed!")
spark.stop()
