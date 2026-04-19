# Kubernetes Learning Cluster with Vagrant

Spin up a full 3-node Kubernetes cluster on VirtualBox with **one command**.

## Cluster Architecture

```
Host Machine (Windows)
│
├── VirtualBox
│   ├── master   (192.168.56.10)  — Control Plane  — 2 CPU, 2 GB RAM
│   ├── worker1  (192.168.56.11)  — Worker Node     — 1 CPU, 1 GB RAM
│   └── worker2  (192.168.56.12)  — Worker Node     — 1 CPU, 1 GB RAM
│
└── /vagrant shared folder = this project directory
```

**Software stack:**
- OS: Ubuntu 22.04 LTS (jammy)
- Container Runtime: containerd
- Cluster Bootstrap: kubeadm
- CNI Plugin: Flannel (pod CIDR: 10.244.0.0/16)
- Kubernetes: v1.29

---

## Prerequisites

Install these on your Windows machine:

1. **VirtualBox** — https://www.virtualbox.org/
2. **Vagrant** — https://developer.hashicorp.com/vagrant/downloads

Verify installation:
```powershell
vagrant --version   # should show 2.x.x
VBoxManage --version
```

---

## Quick Start

```bash
# 1. Navigate to this folder
cd k8s-mastery/vagrant-k8s

# 2. Start the cluster (first time takes 10-15 minutes)
vagrant up

# 3. SSH into master
vagrant ssh master

# 4. Verify cluster
kubectl get nodes
# NAME      STATUS   ROLES           AGE   VERSION
# master    Ready    control-plane   5m    v1.29.x
# worker1   Ready    <none>          3m    v1.29.x
# worker2   Ready    <none>          3m    v1.29.x
```

---

## Daily Workflow

```bash
# Start cluster (no reprovisioning — VMs resume from saved state)
vagrant up

# Stop cluster (saves state — fast restart next time)
vagrant halt

# SSH into specific node
vagrant ssh master
vagrant ssh worker1
vagrant ssh worker2

# Check VM status
vagrant status

# Restart a single node
vagrant reload master

# Completely destroy and recreate (fresh start)
vagrant destroy -f && vagrant up

# Reprovision without destroy
vagrant provision master
```

---

## Using kubectl from Master

```bash
vagrant ssh master

# Pre-configured shortcuts (defined in .bashrc):
kubectl get nodes          # kgn
kubectl get pods -A        # kgpa
kubectl get pods           # kgp
kubectl get svc            # kgs
kubectl get deployments    # kgd
kubectl apply -f file.yaml # kaf file.yaml
kubectl delete -f file.yaml # kdf file.yaml
kubectl describe pod <name> # kdp <name>
kubectl logs <pod>          # klog <pod>
kubectl exec -it <pod> -- bash  # kex <pod> -- bash
```

---

## Using kubectl from Your Host Machine (Optional)

The kubeconfig is automatically copied to `./admin.conf` after provisioning.

```bash
# Windows PowerShell
$env:KUBECONFIG = "C:\Users\Admin\Desktop\Interview 2026\k8s-mastery\vagrant-k8s\admin.conf"
kubectl get nodes

# Or copy to default location
copy admin.conf %USERPROFILE%\.kube\config
```

---

## Practice Exercises

### Deploy your first app
```bash
vagrant ssh master

# Deploy nginx
kubectl create deployment nginx --image=nginx --replicas=2
kubectl get pods -o wide          # see which worker they landed on
kubectl expose deployment nginx --port=80 --type=NodePort
kubectl get svc                   # get the NodePort number

# Access it (replace 30xxx with actual NodePort)
curl http://192.168.56.11:30xxx
```

### Explore cluster components
```bash
# All system pods
kubectl get pods -n kube-system

# Node details
kubectl describe node master
kubectl describe node worker1

# Cluster info
kubectl cluster-info
kubectl get componentstatuses
```

### Test pod scheduling
```bash
# Deploy to a specific node
kubectl run test --image=busybox --overrides='{"spec":{"nodeName":"worker1"}}'

# Label a node
kubectl label node worker1 disk=ssd
kubectl get nodes --show-labels

# NodeSelector in a deployment
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ssd-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ssd-app
  template:
    metadata:
      labels:
        app: ssd-app
    spec:
      nodeSelector:
        disk: ssd
      containers:
      - name: app
        image: nginx
EOF
```

---

## Troubleshooting

### Nodes stuck in NotReady
```bash
# Check CNI pods
kubectl get pods -n kube-flannel
# If flannel pods are not running, reinstall:
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml
```

### Worker can't join
```bash
# Regenerate a join token on master
vagrant ssh master
kubeadm token create --print-join-command

# Run the output on the worker
vagrant ssh worker1
# paste the join command
```

### VM won't start (not enough RAM)
Edit `Vagrantfile` and reduce memory:
```ruby
vb.memory = 1536   # master (reduce from 2048)
vb.memory = 768    # workers (reduce from 1024)
```

### Reset everything on a node
```bash
# On the node you want to reset
sudo kubeadm reset -f
sudo rm -rf /etc/cni/net.d
sudo ipvsadm --clear  # if ipvs is installed

# Then rejoin (workers) or reinit (master)
```

---

## File Structure

```
vagrant-k8s/
├── Vagrantfile          — VM definitions + networking
├── scripts/
│   ├── common.sh        — Runs on ALL nodes (containerd, kubeadm install)
│   ├── master.sh        — Runs on master (kubeadm init, Flannel, kubeconfig)
│   └── worker.sh        — Runs on workers (kubeadm join)
├── admin.conf           — Generated kubeconfig (after vagrant up)
├── join.sh              — Generated join command (after master provisions)
└── kubeadm-init.log     — Full init log (for debugging)
```

---

## Resource Requirements

| Node    | CPU | RAM   | Disk   |
|---------|-----|-------|--------|
| master  | 2   | 2 GB  | ~10 GB |
| worker1 | 1   | 1 GB  | ~8 GB  |
| worker2 | 1   | 1 GB  | ~8 GB  |
| **Total** | **4** | **4 GB** | **~26 GB** |

Minimum host RAM recommended: **8 GB** (4 GB for VMs + 4 GB for Windows)
