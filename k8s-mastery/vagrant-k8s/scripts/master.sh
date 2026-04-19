#!/bin/bash
# =============================================================================
# master.sh — Runs ONLY on the master/control-plane node
# Initializes the Kubernetes cluster and installs Flannel CNI
# =============================================================================
set -euo pipefail

MASTER_IP="${MASTER_IP:-192.168.56.10}"
POD_CIDR="${POD_CIDR:-10.244.0.0/16}"

echo "====> [master] Initializing Kubernetes control plane..."
echo "      API Server IP : $MASTER_IP"
echo "      Pod CIDR      : $POD_CIDR"

# ── 1. kubeadm init ──────────────────────────────────────────────────────────
kubeadm init \
  --apiserver-advertise-address="$MASTER_IP" \
  --apiserver-cert-extra-sans="$MASTER_IP" \
  --pod-network-cidr="$POD_CIDR" \
  --node-name=master \
  --ignore-preflight-errors=Swap \
  2>&1 | tee /vagrant/kubeadm-init.log

echo "====> [master] kubeadm init completed."

# ── 2. Configure kubectl for root and vagrant users ──────────────────────────
echo "====> [master] Setting up kubeconfig..."

# For root
mkdir -p /root/.kube
cp /etc/kubernetes/admin.conf /root/.kube/config

# For vagrant user
mkdir -p /home/vagrant/.kube
cp /etc/kubernetes/admin.conf /home/vagrant/.kube/config
chown -R vagrant:vagrant /home/vagrant/.kube

# Copy to shared /vagrant folder so host machine can also use it
cp /etc/kubernetes/admin.conf /vagrant/admin.conf
echo "      kubeconfig copied to /vagrant/admin.conf (host machine can use this)"

# ── 3. Install Flannel CNI ────────────────────────────────────────────────────
echo "====> [master] Installing Flannel CNI..."
kubectl apply -f \
  https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml \
  --kubeconfig /etc/kubernetes/admin.conf

# ── 4. Generate worker join command ──────────────────────────────────────────
echo "====> [master] Generating worker join command..."
kubeadm token create --print-join-command > /vagrant/join.sh
chmod +x /vagrant/join.sh
echo "      Join command saved to /vagrant/join.sh"

# ── 5. Install kubectl autocomplete & aliases for vagrant user ───────────────
echo "====> [master] Setting up kubectl shortcuts..."
cat <<'EOF' >> /home/vagrant/.bashrc

# ── Kubernetes shortcuts ─────────────────────────────────
export KUBECONFIG=/home/vagrant/.kube/config

# Aliases
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgpa='kubectl get pods -A'
alias kgn='kubectl get nodes'
alias kgs='kubectl get svc'
alias kgd='kubectl get deploy'
alias kdp='kubectl describe pod'
alias kdn='kubectl describe node'
alias kaf='kubectl apply -f'
alias kdf='kubectl delete -f'
alias kex='kubectl exec -it'
alias klog='kubectl logs'

# Autocomplete
source <(kubectl completion bash)
complete -o default -F __start_kubectl k
EOF

echo "====> [master] Waiting for nodes to be ready..."
# Wait up to 2 minutes for master to become Ready
for i in $(seq 1 24); do
  STATUS=$(kubectl get node master \
    --kubeconfig /etc/kubernetes/admin.conf \
    -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "Unknown")
  if [ "$STATUS" = "True" ]; then
    echo "      Master node is Ready!"
    break
  fi
  echo "      Waiting for master to be Ready... (${i}/24)"
  sleep 5
done

echo ""
echo "======================================================================"
echo "  Kubernetes master is ready!"
echo "  SSH: vagrant ssh master"
echo "  Then: kubectl get nodes"
echo "======================================================================"
kubectl get nodes --kubeconfig /etc/kubernetes/admin.conf 2>/dev/null || true
