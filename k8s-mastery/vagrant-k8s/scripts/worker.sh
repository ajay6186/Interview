#!/bin/bash
# =============================================================================
# worker.sh — Runs on each worker node
# Joins the node to the Kubernetes cluster created by master.sh
# =============================================================================
set -euo pipefail

echo "====> [worker] Joining cluster on $(hostname)..."

# Wait for master to generate the join command
for i in $(seq 1 30); do
  if [ -f /vagrant/join.sh ]; then
    echo "      Found /vagrant/join.sh"
    break
  fi
  echo "      Waiting for join.sh from master... (${i}/30)"
  sleep 10
done

if [ ! -f /vagrant/join.sh ]; then
  echo "ERROR: /vagrant/join.sh not found after waiting. Did master provision first?"
  exit 1
fi

# Join the cluster (append --node-name so it matches hostname)
bash /vagrant/join.sh --node-name "$(hostname)" --ignore-preflight-errors=Swap

echo "====> [worker] $(hostname) joined the cluster successfully!"

# ── kubectl aliases (optional — useful if you want to run kubectl from worker) ──
cat <<'EOF' >> /home/vagrant/.bashrc

# Kubernetes aliases (kubectl config on master — run commands from there)
alias k='kubectl'
EOF

echo "====> [worker] Done! Check cluster status from master: vagrant ssh master && kubectl get nodes"
