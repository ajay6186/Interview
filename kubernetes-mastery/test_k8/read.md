kubectl
   ↓
Reads kubeconfig
   ↓
Gets current-context
   ↓
Finds cluster + user
   ↓
Connects API Server
   ↓
Returns pods


kubectl config get-contexts
kubectl config current-context
kubectl get nodes