# Exercise 6.3 — Priority Classes

## What you'll learn
- PriorityClass: assign numerical priority to pods
- Higher priority pods preempt lower priority pods under resource pressure
- System-level priority for critical infrastructure pods
- `preemptionPolicy: Never` for non-preempting priorities

## Instructions
Complete `exercise/manifest.yaml` with priority classes.

## Verify
```bash
kubectl apply -f exercise/manifest.yaml
kubectl get priorityclass

kubectl describe pod high-priority-pod
# Look for Priority field

# Simulate preemption (if cluster is full):
# The high-priority pod should evict low-priority pods to get resources

kubectl delete -f exercise/manifest.yaml
```

## Key concepts
- Higher `value` = higher priority (built-in system: 2,000,000,000)
- `globalDefault: true`: applied to pods without a priorityClassName
- Preemption: scheduler evicts lower-priority pods to make room
- `preemptionPolicy: Never`: priority for ordering, no preemption
- Common pattern: critical > high > normal > low > batch
