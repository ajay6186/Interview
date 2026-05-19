# GCP GitOps Kata Mastery Course

A hands-on learning path for completing GCP GitOps Kata Challenges 101–104 and 201.

## What You Will Learn

| Phase | Topic | Kata Challenges |
|-------|-------|-----------------|
| 1 | GitOps Workflow, kustomization.yaml, Config Sync | Foundation for all challenges |
| 2 | GCS Bucket Creation, IAM, Multi-Region, Lifecycle | 101, 102, 103, 104 |
| 3 | Personal Namespaces, Workload Identity, KSA/GSA | 201 |
| 4 | Verification with nomos, kubectl, gcloud | All challenges |

## Learning Path

```
Phase 1: GitOps Workflow
  ├── 01 - What is GitOps (CND repo, Config Sync, PR flow)
  ├── 02 - kustomization.yaml and resource registration
  └── 03 - Standard PR workflow at CME

Phase 2: GCS Challenges
  ├── 01 - Challenge 101: Create a GCS Bucket (KMS + StorageBucket + IAM)
  ├── 02 - Challenge 102: Add IAM policy to GCS bucket
  ├── 03 - Challenge 103: Convert to dual-region bucket
  └── 04 - Challenge 104: Add lifecycle policy (delete after 7 days)

Phase 3: Kubernetes & Workload Identity
  ├── 01 - Personal Namespaces (SubnamespaceAnchor)
  ├── 02 - Workload Identity deep dive (KSA ↔ GSA mapping)
  └── 03 - Challenge 201: Personal Namespace IAM (full walkthrough)

Phase 4: Verification & Debugging
  ├── 01 - nomos and kubectl verification commands
  └── 02 - gcloud commands for GCS testing
```

## Key Concepts Glossary

| Term | Meaning |
|------|---------|
| CND | Your GitOps repository (the source of truth) |
| Config Sync | GKE add-on that watches your CND repo and applies resources |
| KCC | Kubernetes Config Connector — lets you define GCP resources as YAML |
| StorageBucket | KCC resource kind for a GCS bucket |
| IAMPolicyMember | KCC resource kind for granting an IAM role |
| IAMServiceAccount | KCC resource kind for a Google Service Account |
| KSA | Kubernetes Service Account |
| GSA | Google Service Account |
| Workload Identity | Mechanism linking a KSA to a GSA so pods authenticate as the GSA |
| SubnamespaceAnchor | HNC resource that creates a sub-namespace under your team's sandbox |
| nomos | CLI tool for checking Config Sync status |
| kustomization.yaml | File that lists all resources Config Sync should apply |
