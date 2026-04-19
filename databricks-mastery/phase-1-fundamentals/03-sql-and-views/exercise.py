# ============================================================================
# Exercise 1.3 — Spark SQL and Views
# ============================================================================

from pyspark.sql import SparkSession
from pyspark.sql import functions as F

spark = SparkSession.builder.appName("sql-views-exercise").getOrCreate()
spark.sparkContext.setLogLevel("WARN")

students = spark.createDataFrame([
    (1,"Alice","Math",92),(2,"Bob","Science",78),(3,"Carol","Math",88),
    (4,"Dave","Science",95),(5,"Eve","Math",70),(6,"Frank","Science",60),
    (7,"Grace","History",85),(8,"Heidi","History",91),
], ["id","name","subject","score"])

exams = spark.createDataFrame([
    (1,1,"Midterm",88),(2,1,"Final",96),(3,2,"Midterm",74),
    (4,2,"Final",82),(5,3,"Midterm",90),(6,3,"Final",86),
], ["exam_id","student_id","exam_type","score"])

# ---------------------------------------------------------------------------
# 1. Register temp views
# ---------------------------------------------------------------------------
# TODO: register students as "students" and exams as "exams"

# ---------------------------------------------------------------------------
# 2. Basic SQL: top 3 students by score
# ---------------------------------------------------------------------------
# TODO: top3 = spark.sql(...)
top3 = None  # replace None

assert top3.count() == 3

# ---------------------------------------------------------------------------
# 3. Average score per subject using SQL
# ---------------------------------------------------------------------------
# TODO: subj_avg = spark.sql(...)  columns: subject, avg_score
subj_avg = None  # replace None

assert "avg_score" in subj_avg.columns

# ---------------------------------------------------------------------------
# 4. CTE: students above subject average
# ---------------------------------------------------------------------------
# TODO: above_avg = spark.sql("""WITH ... SELECT ...""")
above_avg = None  # replace None

assert above_avg.count() > 0

# ---------------------------------------------------------------------------
# 5. JOIN: student name + their exam scores
# ---------------------------------------------------------------------------
# TODO: joined = spark.sql(... INNER JOIN ...)  columns include name, exam_type, score
joined = None  # replace None

assert "name" in joined.columns
assert "exam_type" in joined.columns

# ---------------------------------------------------------------------------
# 6. Window: rank students within each subject by score DESC
# ---------------------------------------------------------------------------
# TODO: ranked = spark.sql(... ROW_NUMBER() OVER (PARTITION BY ...) ...)
ranked = None  # replace None

assert "rn" in ranked.columns

# ---------------------------------------------------------------------------
# 7. Top student per subject (rn = 1)
# ---------------------------------------------------------------------------
# TODO: top_per_subject = filter ranked where rn == 1
top_per_subject = None  # replace None

subjects = [r["subject"] for r in top_per_subject.select("subject").collect()]
assert set(subjects) == {"Math", "Science", "History"}

# ---------------------------------------------------------------------------
# 8. CASE WHEN: label score as A/B/C/D
# ---------------------------------------------------------------------------
# TODO: graded = spark.sql(... CASE WHEN score >= 90 THEN 'A' ...)
graded = None  # replace None

assert "grade" in graded.columns

print("All assertions passed!")
spark.stop()
