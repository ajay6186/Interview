# Theory: ML Feature Store

## What is a Feature Store?

A Feature Store is a centralized repository that stores, manages, and serves ML features. It solves the "training-serving skew" problem — the same feature computation is used consistently at both training time and inference time.

```
Problems without a Feature Store:
  ┌─────────────────────────────────────────────────────┐
  │ Training:   compute features in notebook (ad-hoc)  │
  │ Serving:    re-implement in Java/REST (may differ) │
  │ Result:     model trained on features A, served B  │
  │             → silent accuracy degradation          │
  └─────────────────────────────────────────────────────┘

With a Feature Store:
  ┌─────────────────────────────────────────────────────┐
  │ Feature pipelines → Feature Store (Delta tables)   │
  │ Training:  join features at point-in-time           │
  │ Serving:   same feature logic, same store           │
  │ Result:    training = serving → no skew             │
  └─────────────────────────────────────────────────────┘
```

---

## Feature Engineering Pipeline

```python
from pyspark.sql import functions as F
from pyspark.sql.window import Window

def compute_customer_features(spark, as_of_date: str):
    """
    Compute behavioral features for churn prediction.
    as_of_date: point-in-time cutoff (prevents data leakage).
    """
    orders = (spark.table("silver.orders")
        .filter(F.col("created_at") <= as_of_date)
        .filter(F.col("status") == "delivered"))

    # RFM Features (Recency, Frequency, Monetary)
    rfm = orders.groupBy("customer_id").agg(
        F.datediff(F.lit(as_of_date), F.max(F.to_date("created_at"))).alias("recency_days"),
        F.count("*").alias("frequency"),
        F.sum("amount").alias("monetary_value"),
        F.avg("amount").alias("avg_order_value"),
        F.min("amount").alias("min_order_value"),
        F.max("amount").alias("max_order_value"),
        F.stddev("amount").alias("stddev_order_value"),
    )

    # Rolling 30-day features
    w30 = (Window.partitionBy("customer_id")
           .orderBy(F.col("created_at").cast("long"))
           .rangeBetween(-30*86400, 0))
    recent = orders.withColumn("orders_30d", F.count("*").over(w30)) \
                   .withColumn("revenue_30d", F.sum("amount").over(w30)) \
                   .dropDuplicates(["customer_id"]) \
                   .select("customer_id", "orders_30d", "revenue_30d")

    return rfm.join(recent, "customer_id", "left") \
              .withColumn("feature_date", F.lit(as_of_date).cast("date"))
```

---

## Databricks Feature Engineering Client

```python
from databricks.feature_engineering import FeatureEngineeringClient, FeatureLookup
fe = FeatureEngineeringClient()

# 1. Create feature table (Delta table managed by Feature Store)
fe.create_table(
    name="prod_catalog.ml_features.customer_features",
    primary_keys=["customer_id"],
    timestamp_keys=["feature_date"],       # enables point-in-time lookups
    df=features_df,
    description="Customer RFM and behavioral features",
    tags={"team": "ml-platform", "model": "churn"}
)

# 2. Update features (incremental write)
fe.write_table(
    name="prod_catalog.ml_features.customer_features",
    df=new_features_df,
    mode="merge"   # merge on primary keys
)

# 3. Create training dataset with point-in-time correct feature lookup
labels = spark.table("ml.churn_labels")   # customer_id, label, label_date

training_set = fe.create_training_set(
    df=labels,
    feature_lookups=[
        FeatureLookup(
            table_name="prod_catalog.ml_features.customer_features",
            feature_names=["recency_days", "frequency", "monetary_value",
                           "avg_order_value", "orders_30d"],
            lookup_key="customer_id",
            timestamp_lookup_key="label_date"   # point-in-time correct
        ),
        FeatureLookup(
            table_name="prod_catalog.ml_features.product_features",
            feature_names=["category_affinity"],
            lookup_key="customer_id",
            timestamp_lookup_key="label_date"
        ),
    ],
    label="churn_label",
    exclude_columns=["label_date"]
)

training_df = training_set.load_df()  # Spark DataFrame with features joined
```

---

## Training with Feature Store

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score

# Convert to pandas for sklearn (or use MLlib for distributed)
pdf = training_df.toPandas()
X = pdf.drop(columns=["customer_id", "churn_label"])
y = pdf["churn_label"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

mlflow.set_experiment("/ml/churn_prediction")
with mlflow.start_run(run_name="gbt_v1"):
    params = {"n_estimators": 200, "learning_rate": 0.05, "max_depth": 6}
    mlflow.log_params(params)

    model = GradientBoostingClassifier(**params)
    model.fit(X_train, y_train)

    auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    mlflow.log_metric("roc_auc", auc)

    # Log model WITH feature store metadata (links features to model)
    fe.log_model(
        model=model,
        artifact_path="churn_model",
        flavor=mlflow.sklearn,
        training_set=training_set,
        registered_model_name="prod_catalog.ml.ChurnPredictor"
    )
```

---

## Batch Inference with Feature Store

```python
# Score new customers — Feature Store auto-looks up features
customers_to_score = spark.table("silver.customers") \
    .select("customer_id") \
    .withColumn("inference_date", F.current_date())

predictions = fe.score_batch(
    model_uri="models:/prod_catalog.ml.ChurnPredictor@champion",
    df=customers_to_score,
    result_type="double"   # predicted churn probability
)
# predictions has: customer_id, inference_date, prediction (churn prob)

# Write predictions to Gold for downstream use
(predictions
    .withColumn("risk_tier",
        F.when(F.col("prediction") >= 0.7, "High")
         .when(F.col("prediction") >= 0.4, "Medium")
         .otherwise("Low"))
    .write.format("delta")
    .mode("overwrite")
    .option("replaceWhere", f"inference_date = '{str(datetime.date.today())}'")
    .saveAsTable("gold.churn_predictions"))
```

---

## Feature Drift Monitoring

```python
def monitor_feature_drift(spark, baseline_date: str, current_date: str):
    """Compare feature distributions to detect drift."""
    baseline = (spark.table("prod_catalog.ml_features.customer_features")
        .filter(F.col("feature_date") == baseline_date))
    current  = (spark.table("prod_catalog.ml_features.customer_features")
        .filter(F.col("feature_date") == current_date))

    numeric_cols = ["recency_days", "frequency", "monetary_value", "avg_order_value"]
    results = []
    for col in numeric_cols:
        b_stats = baseline.agg(F.avg(col), F.stddev(col)).collect()[0]
        c_stats = current.agg(F.avg(col), F.stddev(col)).collect()[0]
        pct_change = abs(c_stats[0] - b_stats[0]) / (b_stats[0] + 1e-9) * 100
        results.append({"feature": col, "baseline_mean": b_stats[0],
                        "current_mean": c_stats[0], "pct_change": round(pct_change, 2),
                        "drift_detected": pct_change > 20})
    return results
```

---

## Common Interview Questions

**Q: What is training-serving skew and how does a Feature Store prevent it?**  
A: Training-serving skew occurs when features are computed differently at training time (in a notebook) vs inference time (in a production service). Small discrepancies (different null handling, rounding, time zones) lead to the model performing worse than expected. A Feature Store centralizes feature computation — training reads from the same feature table as serving.

**Q: What is point-in-time correct feature lookup?**  
A: When creating a training dataset, features for a label at date T should use only features that were known at or before time T — not future data. Without point-in-time lookup, you'd accidentally use future feature values → data leakage → optimistic offline metrics. Feature Store handles this via `timestamp_lookup_key`.

**Q: What is the difference between `fe.create_table` and `fe.write_table`?**  
A: `create_table` creates the feature table schema and writes initial data. `write_table(mode="merge")` adds/updates features for existing primary keys. In production, run feature pipelines on a schedule and `write_table(mode="merge")` to keep features fresh.

**Q: How do you detect feature drift?**  
A: Compare statistical moments (mean, stddev, quantiles) between a baseline period and the current period. A >20% change in mean or a 2-sigma shift in distribution suggests drift. Use the Population Stability Index (PSI) for a more rigorous measure. Drift often precedes model degradation.

**Q: How does `fe.score_batch` work?**  
A: It takes a DataFrame with primary keys (e.g., `customer_id`), automatically looks up all features registered for that model from the Feature Store at the latest timestamp, then applies the model. You don't need to manually join features — the Feature Store metadata recorded at `log_model` time is used.

---

## Quick Reference

```python
from databricks.feature_engineering import FeatureEngineeringClient, FeatureLookup
fe = FeatureEngineeringClient()

# Create feature table
fe.create_table(name="catalog.schema.features", primary_keys=["id"],
                timestamp_keys=["date"], df=df)

# Update features
fe.write_table(name="catalog.schema.features", df=new_df, mode="merge")

# Training set (point-in-time)
training_set = fe.create_training_set(
    df=labels,
    feature_lookups=[FeatureLookup(table_name="...", feature_names=[...],
                                   lookup_key="id", timestamp_lookup_key="date")],
    label="target"
)
training_df = training_set.load_df()

# Log model with feature lineage
fe.log_model(model=model, artifact_path="model", flavor=mlflow.sklearn,
             training_set=training_set, registered_model_name="catalog.schema.Model")

# Batch inference
predictions = fe.score_batch(model_uri="models:/Model@champion", df=keys_df)
```
