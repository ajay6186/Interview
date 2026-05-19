# Phase 3.01 — Personal Namespaces (SubnamespaceAnchor)

## Objective
Understand how personal Kubernetes namespaces work at CME so you can complete Challenge 201.

---

## What is a Personal Namespace?

At CME, each developer gets their own Kubernetes namespace (a "sub-namespace") under their
team's sandbox namespace. This lets you deploy and test Kubernetes workloads without affecting
other team members.

```
gke-cluster
└── <team>-sandbox namespace       (team's top-level sandbox)
    └── <your-username> namespace  (your personal namespace — sub-namespace)
        └── your pods, services, etc.
```

---

## HNC: Hierarchical Namespace Controller

Personal namespaces use **HNC (Hierarchical Namespace Controller)**.
You create a `SubnamespaceAnchor` resource in the parent namespace, and HNC automatically
creates a child namespace.

---

## Example: Creating a Personal Namespace

```yaml
# This file goes in YOUR TEAM'S SANDBOX namespace, not infra/envs
# File: personal-namespace.yaml
apiVersion: hnc.x-k8s.io/v1alpha2
kind: SubnamespaceAnchor
metadata:
  name: ajay-yadav                 # your username or alias
  namespace: cde-auto-sx           # your team's sandbox namespace (e.g., cde-auto-sx)
```

**Where to place this file**: Follow the `202_personal-namespaces` kata instructions for
the exact directory in your CND repo.

---

## Finding Your Team's Sandbox Namespace

Look for it in the `gke-rs-app-namespaces` repository, or ask your team.
Example: `cde-auto-sx` is the sandbox for the `cde-auto` project.

---

## Deploying with kubectl (for your personal namespace)

After your namespace is created, you can deploy workloads directly with kubectl
(without going through a PR, useful for testing):

```bash
# Check your namespace exists
kubectl get namespace ajay-yadav

# Deploy a pod to your namespace
kubectl apply -f my-pod.yaml -n ajay-yadav

# Check pods in your namespace
kubectl get pods -n ajay-yadav
```

---

## LDAP Group and RoleBinding

Your personal namespace needs a RoleBinding that allows your LDAP group to deploy to it.
The `SubnamespaceAnchor` example in the kata shows this clearly — pay close attention to
which LDAP group is used in the rolebinding.

Example rolebinding:
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: allow-my-ldap-group
  namespace: ajay-yadav
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: edit
subjects:
  - apiGroup: rbac.authorization.k8s.io
    kind: Group
    name: pd_2188_myteam_admin@cmegroup.com    # your LDAP group
```

---

## Common Issues

| Issue | Fix |
|-------|-----|
| "access denied" creating subnamespace | Your LDAP group must have permission to create sub-namespaces in the parent |
| Namespace not created after PR merge | Check `kubectl get subnamespaceanchor -n <parent-ns>` for errors |
| Can't deploy to your namespace | Check the RoleBinding has your LDAP group |

---

## Practice Exercise

1. Identify your team's sandbox namespace (e.g., `cde-auto-sx`)
2. Find the example `SubnamespaceAnchor` in the `202_personal-namespaces` kata
3. Understand what LDAP group is in the rolebinding YAML
4. Know that the sub-namespace name becomes your personal namespace name
