# Phase 1.01 — What is GitOps?

## Core Concept

GitOps is the practice of using a **Git repository as the single source of truth** for infrastructure.
You never click buttons in the GCP Console or run `gcloud` to create resources directly.
Instead you:
1. Write a YAML file describing the desired state.
2. Push it to your CND GitOps repository.
3. Open a Pull Request → get it approved → merge.
4. **Config Sync** (running inside GKE) detects the change and applies it to GCP automatically.

```
Developer          Git Repo (CND)         Config Sync           GCP
   |                    |                      |                  |
   |-- git push ------> |                      |                  |
   |                    |-- detects change ---> |                  |
   |                    |                      |-- applies YAML -> |
   |                    |                      |                  |-- GCS bucket created
```

---

## The CND Repository Structure (CME-specific)

```
cnd-repo/
└── infra/
    └── envs/
        └── dv/                      ← dev environment
            └── local/
                └── resources/
                    ├── kustomization.yaml     ← registry of ALL resources
                    ├── gcs-bucket.yaml        ← your StorageBucket resource
                    ├── gcs-iam.yaml           ← your IAMPolicyMember resource
                    └── ...
```

**The golden rule**: every YAML file you create MUST be registered in `kustomization.yaml`.
Config Sync only applies files listed there.

---

## Why GitOps Over Manual?

| Manual (gcloud/Console) | GitOps |
|-------------------------|--------|
| No audit trail | Every change is a git commit |
| Hard to reproduce | YAML is declarative and repeatable |
| Easy to break by accident | PRs provide a review gate |
| Drift between environments | Desired state is always in git |

---

## Practice Exercise

Answer these before moving on:
1. Where does Config Sync look for resources to apply?
2. What file must you update every time you add a new YAML resource file?
3. Who/what actually creates the GCS bucket in GCP — you or Config Sync?

**Answers**: (1) Your CND repo's `infra/envs/dv/local/resources/` directory. (2) `kustomization.yaml`. (3) Config Sync does — you only write YAML and merge the PR.
