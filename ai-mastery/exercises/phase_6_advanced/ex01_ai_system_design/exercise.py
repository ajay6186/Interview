# ============================================================
# Exercise 6.1 — AI System Design
# ============================================================
# Each TODO below is a design exercise. Implement a function that
# prints a structured description of the system design, including
# components, data flows, trade-offs, and scaling strategies.
# ============================================================

# TODO 1: Design a recommendation system
# Describe: user/item embeddings, retrieval (ANN), ranking model,
# feedback loop, cold-start handling, A/B testing layer.
def design_recommendation_system():
    pass


# TODO 2: Design a real-time fraud detection system
# Describe: feature engineering (velocity, graph), streaming
# inference, model ensemble, thresholds, alert pipeline.
def design_fraud_detection():
    pass


# TODO 3: Design a document search system (RAG at scale)
# Describe: ingestion pipeline, chunking, embedding model,
# vector store, retrieval (hybrid dense+sparse), generation.
def design_rag_search():
    pass


# TODO 4: Design a multi-tenant LLM API service
# Describe: tenant isolation, rate limiting, model routing,
# cost accounting, caching, security boundaries.
def design_multitenant_llm_api():
    pass


# TODO 5: Design an ML feature store
# Describe: offline store (data warehouse), online store (low-latency
# KV), feature pipelines, point-in-time correctness, versioning.
def design_feature_store():
    pass


# TODO 6: Design an A/B testing framework for ML models
# Describe: traffic splitting, assignment consistency, metric
# collection, statistical significance testing, guardrail metrics.
def design_ab_testing_framework():
    pass


# TODO 7: Design a model training pipeline (orchestration)
# Describe: data ingestion, preprocessing, distributed training,
# evaluation gates, artifact registry, deployment trigger.
def design_training_pipeline():
    pass


# TODO 8: Design a real-time NLP pipeline (stream processing)
# Describe: Kafka/Kinesis ingestion, tokenization, model inference,
# post-processing, output sink, latency SLOs.
def design_realtime_nlp_pipeline():
    pass


# TODO 9: Design offline vs online inference trade-offs
# Describe: batch scoring (throughput), online serving (latency),
# near-real-time (micro-batch), when to use each.
def design_inference_trade_offs():
    pass


# TODO 10: Design a model versioning and rollback system
# Describe: semantic versioning for models, artifact storage,
# shadow deployment, canary rollout, automated rollback triggers.
def design_model_versioning():
    pass


# TODO 11: Design a vector database sharding strategy
# Describe: horizontal sharding by embedding space (clustering),
# consistent hashing, replication, query fan-out, merging results.
def design_vector_db_sharding():
    pass


# TODO 12: Estimate capacity — how many GPUs for 1M req/day
# Describe: latency budget, throughput per GPU, redundancy factor,
# peak vs average load, batch size optimization.
def estimate_gpu_capacity():
    pass


# TODO 13: Design a caching strategy for LLM responses
# Describe: semantic caching (embed query, find similar cached
# responses), exact-match cache, TTL policies, cache invalidation.
def design_llm_caching():
    pass


# TODO 14: Design a data flywheel (model → data → retrain)
# Describe: user interaction logging, data quality filtering,
# human-in-the-loop labeling, retraining trigger, deployment loop.
def design_data_flywheel():
    pass


# TODO 15: Write a full AI system design document template
# Describe: executive summary, requirements, architecture diagram
# description, component breakdown, data flow, SLOs, risks.
def ai_system_design_template():
    pass


def main():
    print("=== Exercise 6.1: AI System Design ===")
    print("Implement each design function to print a structured design description.")
    print()
    design_recommendation_system()
    design_fraud_detection()
    design_rag_search()
    design_multitenant_llm_api()
    design_feature_store()
    design_ab_testing_framework()
    design_training_pipeline()
    design_realtime_nlp_pipeline()
    design_inference_trade_offs()
    design_model_versioning()
    design_vector_db_sharding()
    estimate_gpu_capacity()
    design_llm_caching()
    design_data_flywheel()
    ai_system_design_template()


if __name__ == "__main__":
    main()
