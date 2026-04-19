# ============================================================================
# Solution 1.3 — Spark SQL and Views
# ============================================================================

from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("sql-views-solution").getOrCreate()
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

# 1. Register
students.createOrReplaceTempView("students")
exams.createOrReplaceTempView("exams")

# 2. Top 3
top3 = spark.sql("SELECT * FROM students ORDER BY score DESC LIMIT 3")
assert top3.count() == 3

# 3. Avg per subject
subj_avg = spark.sql("SELECT subject, AVG(score) AS avg_score FROM students GROUP BY subject")
assert "avg_score" in subj_avg.columns

# 4. CTE above avg
above_avg = spark.sql("""
    WITH subj_avg AS (
        SELECT subject, AVG(score) AS avg_score FROM students GROUP BY subject
    )
    SELECT s.name, s.subject, s.score
    FROM students s
    JOIN subj_avg a ON s.subject = a.subject
    WHERE s.score > a.avg_score
""")
assert above_avg.count() > 0

# 5. JOIN
joined = spark.sql("""
    SELECT s.name, e.exam_type, e.score
    FROM students s
    INNER JOIN exams e ON s.id = e.student_id
""")
assert "name" in joined.columns and "exam_type" in joined.columns

# 6. Window rank
ranked = spark.sql("""
    SELECT name, subject, score,
           ROW_NUMBER() OVER (PARTITION BY subject ORDER BY score DESC) AS rn
    FROM students
""")
assert "rn" in ranked.columns

# 7. Top per subject
ranked.createOrReplaceTempView("ranked")
top_per_subject = spark.sql("SELECT * FROM ranked WHERE rn = 1")
subjects = [r["subject"] for r in top_per_subject.select("subject").collect()]
assert set(subjects) == {"Math", "Science", "History"}

# 8. Grade
graded = spark.sql("""
    SELECT name, score,
           CASE WHEN score >= 90 THEN 'A'
                WHEN score >= 80 THEN 'B'
                WHEN score >= 70 THEN 'C'
                ELSE 'D' END AS grade
    FROM students
""")
assert "grade" in graded.columns

print("All assertions passed!")
spark.stop()
