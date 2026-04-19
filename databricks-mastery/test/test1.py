from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("Demo").getOrCreate()

data = [("Ajay", 25), ("Rahul", 30), ("Neha", 22)]
df = spark.createDataFrame(data, ["name", "age"])

df.filter(df.age > 23).select("name").show()