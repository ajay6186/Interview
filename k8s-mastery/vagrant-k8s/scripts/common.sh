#!/bin/bash
# =============================================================================
# common.sh — Runs on ALL nodes (master + workers)
# Installs: containerd, kubeadm, kubelet, kubectl
# =============================================================================
set -euo pipefail

K8S_VERSION="1.29"
echo "====> [common] Starting common setup on $(hostname)"

# ── 1. Disable swap (Kubernetes requires swap off) ──────────────────────────
echo "====> [common] Disabling swap..."
swapoff -a
sed -i '/\sswap\s/d' /etc/fstab   # remove swap entry permanently

# ── 2. Load required kernel modules ─────────────────────────────────────────
echo "====> [common] Loading kernel modules..."
cat <<EOF | tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

# ── 3. Sysctl settings for Kubernetes networking ─────────────────────────────
cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF

sysctl --system   # apply without reboot

# ── 4. Install containerd ────────────────────────────────────────────────────
echo "====> [common] Installing containerd..."
apt-get update -qq
apt-get install -y -qq apt-transport-https ca-certificates curl gpg

# Docker's repo provides containerd
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -qq
apt-get install -y -qq containerd.io

# ── 5. Configure containerd to use SystemdCgroup ─────────────────────────────
echo "====> [common] Configuring containerd..."
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml > /dev/null

# Enable SystemdCgroup (required for Kubernetes)
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml

systemctl restart containerd
systemctl enable containerd

# ── 6. Install kubeadm, kubelet, kubectl ────────────────────────────────────
echo "====> [common] Installing kubeadm, kubelet, kubectl v${K8S_VERSION}..."
curl -fsSL "https://pkgs.k8s.io/core:/stable:/v${K8S_VERSION}/deb/Release.key" \
  | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
  https://pkgs.k8s.io/core:/stable:/v${K8S_VERSION}/deb/ /" \
  | tee /etc/apt/sources.list.d/kubernetes.list

apt-get update -qq
apt-get install -y -qq kubelet kubeadm kubectl

# Pin versions — prevent accidental upgrades
apt-mark hold kubelet kubeadm kubectl

# ── 7. Configure kubelet to use the private network IP ───────────────────────
# Get the host-only (eth1) interface IP
PRIVATE_IP=$(ip -4 addr show eth1 2>/dev/null | grep -oP '(?<=inet\s)\d+\.\d+\.\d+\.\d+' || true)
if [ -n "$PRIVATE_IP" ]; then
  echo "KUBELET_EXTRA_ARGS=--node-ip=${PRIVATE_IP}" \
    > /etc/default/kubelet
fi

systemctl daemon-reload
systemctl enable kubelet

echo "====> [common] Done! $(hostname) is ready for Kubernetes."
