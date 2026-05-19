# GPU and ML Workloads on GKE — Examples

## Basic

### 1. Create a GPU Node Pool (NVIDIA T4)
Create a node pool with NVIDIA T4 GPUs to run ML inference and training workloads on GKE.

```bash
gcloud container node-pools create gpu-t4-pool \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --machine-type=n1-standard-4 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --num-nodes=1 \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=8 \
  --node-taints=nvidia.com/gpu=present:NoSchedule
```

---

### 2. Install NVIDIA Device Plugin DaemonSet
Deploy the NVIDIA GPU device plugin so Kubernetes can discover and schedule GPU resources on nodes.

```bash
# Install via the GKE-managed installer DaemonSet
kubectl apply -f \
  https://raw.githubusercontent.com/GoogleCloudPlatform/container-engine-accelerators/master/nvidia-driver-installer/cos/daemonset-preloaded.yaml

# Verify the device plugin is running
kubectl get daemonset nvidia-gpu-device-plugin \
  -n kube-system
```

---

### 3. Request a GPU Resource in a Pod
Define a pod that requests an NVIDIA GPU resource so Kubernetes schedules it on an available GPU node.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-test-pod
  namespace: ml-workloads
spec:
  tolerations:
  - key: nvidia.com/gpu
    operator: Equal
    value: present
    effect: NoSchedule
  containers:
  - name: cuda-container
    image: nvidia/cuda:12.2-base-ubuntu22.04
    command: ["nvidia-smi"]
    resources:
      limits:
        nvidia.com/gpu: "1"
  restartPolicy: Never
```

---

### 4. Verify GPU Availability in the Cluster
Check that GPU resources are being reported by nodes and are allocatable to workloads.

```bash
kubectl get nodes \
  -o custom-columns=\
"NAME:.metadata.name,\
GPU-CAPACITY:.status.capacity.nvidia\.com/gpu,\
GPU-ALLOCATABLE:.status.allocatable.nvidia\.com/gpu,\
STATUS:.status.conditions[-1].type"
```

---

### 5. List Nodes with GPUs
Display all cluster nodes that have GPU accelerators attached along with their accelerator type.

```bash
kubectl get nodes \
  -l cloud.google.com/gke-accelerator \
  -o custom-columns=\
"NAME:.metadata.name,\
ACCELERATOR:.metadata.labels.cloud\.google\.com/gke-accelerator,\
GPU-COUNT:.status.capacity.nvidia\.com/gpu"
```

---

### 6. Run a Simple CUDA Workload
Execute a basic CUDA vector addition job to validate the GPU node pool and device plugin are functioning correctly.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: cuda-vector-add
  namespace: ml-workloads
spec:
  template:
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: cuda-vector-add
        image: gcr.io/my-gcp-project/cuda-samples:vectorAdd
        resources:
          limits:
            nvidia.com/gpu: "1"
      restartPolicy: Never
  backoffLimit: 3
```

---

### 7. Check GPU Utilization with nvidia-smi
Exec into a running GPU container to inspect real-time GPU memory and compute utilization.

```bash
# Get the name of a running GPU pod
GPU_POD=$(kubectl get pods -n ml-workloads \
  -l app=ml-trainer \
  -o jsonpath='{.items[0].metadata.name}')

# Run nvidia-smi inside the container
kubectl exec -n ml-workloads "$GPU_POD" -- nvidia-smi

# Continuous monitoring mode
kubectl exec -n ml-workloads "$GPU_POD" -- \
  nvidia-smi dmon -s u -d 5
```

---

### 8. Create a GPU Node Pool with A100 Machines
Provision an A100 node pool for large-scale distributed training workloads requiring high-bandwidth GPU interconnects.

```bash
gcloud container node-pools create gpu-a100-pool \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --machine-type=a2-highgpu-1g \
  --accelerator=type=nvidia-tesla-a100,count=1 \
  --num-nodes=0 \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=4 \
  --node-taints=nvidia.com/gpu=present:NoSchedule \
  --node-labels=accelerator-type=a100
```

---

### 9. Set GPU Resource Limits on a Deployment
Configure GPU resource limits on an inference deployment so each replica uses exactly one GPU for serving.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: inference-server
  namespace: ml-workloads
spec:
  replicas: 2
  selector:
    matchLabels:
      app: inference-server
  template:
    metadata:
      labels:
        app: inference-server
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: inference
        image: gcr.io/my-gcp-project/inference:latest
        resources:
          requests:
            cpu: "4"
            memory: 16Gi
            nvidia.com/gpu: "1"
          limits:
            nvidia.com/gpu: "1"
```

---

### 10. Create a Namespace for ML Workloads
Set up a dedicated namespace with appropriate labels for ML workloads to enable resource isolation and cost tracking.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ml-workloads
  labels:
    team: ml-platform
    cost-center: ai-research
    environment: production
  annotations:
    scheduler.alpha.kubernetes.io/node-selector: "accelerator-type=t4"
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ml-gpu-quota
  namespace: ml-workloads
spec:
  hard:
    requests.nvidia.com/gpu: "8"
    limits.nvidia.com/gpu: "8"
    requests.cpu: "32"
    requests.memory: 128Gi
```

---

### 11. Pull a Pre-Built ML Container Image
Authenticate to Artifact Registry and pull a pre-built PyTorch training container image for use in jobs.

```bash
# Configure Docker to authenticate to Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Pull the ML training image
docker pull \
  us-central1-docker.pkg.dev/my-gcp-project/ml-images/pytorch-trainer:2.1-cuda12.2

# Tag and push a custom image
docker tag my-local-trainer:latest \
  us-central1-docker.pkg.dev/my-gcp-project/ml-images/my-trainer:v1.0

docker push \
  us-central1-docker.pkg.dev/my-gcp-project/ml-images/my-trainer:v1.0
```

---

### 12. Run a TensorFlow Training Job as a Kubernetes Job
Submit a TensorFlow model training job to the cluster that runs to completion and reports training metrics.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: tf-training-job
  namespace: ml-workloads
spec:
  completions: 1
  parallelism: 1
  backoffLimit: 2
  template:
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: tf-trainer
        image: us-central1-docker.pkg.dev/my-gcp-project/ml-images/tf-trainer:2.14
        command:
        - python3
        - /app/train.py
        - --epochs=10
        - --batch-size=64
        - --model-dir=/models/output
        env:
        - name: TF_CPP_MIN_LOG_LEVEL
          value: "2"
        resources:
          requests:
            cpu: "4"
            memory: 16Gi
            nvidia.com/gpu: "1"
          limits:
            nvidia.com/gpu: "1"
        volumeMounts:
        - name: model-storage
          mountPath: /models
      restartPolicy: OnFailure
      volumes:
      - name: model-storage
        persistentVolumeClaim:
          claimName: model-pvc
```

---

### 13. Mount a PVC for Training Data
Create a PersistentVolumeClaim backed by a GCS-based volume and mount it into a training pod for dataset access.

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: training-data-pvc
  namespace: ml-workloads
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: standard-rwo
  resources:
    requests:
      storage: 500Gi
---
apiVersion: v1
kind: Pod
metadata:
  name: data-prep-pod
  namespace: ml-workloads
spec:
  containers:
  - name: data-prep
    image: us-central1-docker.pkg.dev/my-gcp-project/ml-images/data-prep:latest
    resources:
      requests:
        cpu: "2"
        memory: 8Gi
      limits:
        cpu: "4"
        memory: 16Gi
    volumeMounts:
    - name: training-data
      mountPath: /data
  volumes:
  - name: training-data
    persistentVolumeClaim:
      claimName: training-data-pvc
  restartPolicy: Never
```

---

### 14. Check GPU Node Labels
Inspect the labels applied to GPU nodes to understand what accelerator metadata is available for scheduling decisions.

```bash
# Show all labels on GPU nodes
kubectl get nodes \
  -l cloud.google.com/gke-accelerator \
  -o json | jq -r '
    .items[] |
    "Node: \(.metadata.name)\n" +
    (.metadata.labels | to_entries[] |
      select(.key | startswith("cloud.google.com") or startswith("nvidia")) |
      "  \(.key): \(.value)") +
    "\n"'
```

---

### 15. Enable GPU Monitoring (dcgm-exporter)
Deploy the NVIDIA DCGM Exporter DaemonSet to expose GPU metrics to Prometheus for cluster-wide GPU observability.

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: dcgm-exporter
  namespace: gpu-monitoring
  labels:
    app: dcgm-exporter
spec:
  selector:
    matchLabels:
      app: dcgm-exporter
  template:
    metadata:
      labels:
        app: dcgm-exporter
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9400"
    spec:
      nodeSelector:
        cloud.google.com/gke-accelerator: nvidia-tesla-t4
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: dcgm-exporter
        image: nvcr.io/nvidia/k8s/dcgm-exporter:3.3.0-3.2.0-ubuntu22.04
        ports:
        - name: metrics
          containerPort: 9400
        securityContext:
          runAsNonRoot: false
          runAsUser: 0
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
```

---

## Intermediate

### 16. Multi-Instance GPU (MIG) — Enable on A100 Node Pool
Enable NVIDIA Multi-Instance GPU partitioning on the A100 node pool to allow multiple workloads to share a single physical GPU.

```bash
# Enable MIG on the node pool via a DaemonSet
kubectl apply -f - <<'EOF'
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: mig-manager
  namespace: gpu-operator
spec:
  selector:
    matchLabels:
      app: mig-manager
  template:
    metadata:
      labels:
        app: mig-manager
    spec:
      nodeSelector:
        accelerator-type: a100
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      hostPID: true
      containers:
      - name: mig-manager
        image: nvcr.io/nvidia/mig-manager:0.5.5
        env:
        - name: MIG_PARTED_CONFIG_FILE
          value: /etc/nvidia/mig-parted-config.yaml
        securityContext:
          privileged: true
        volumeMounts:
        - name: mig-config
          mountPath: /etc/nvidia
      volumes:
      - name: mig-config
        configMap:
          name: mig-partition-config
EOF
```

---

### 17. MIG — Configure GPU Partitioning Profiles
Define MIG partition profiles to split one A100 GPU into multiple isolated instances for different workload sizes.

```yaml
# ConfigMap with MIG partitioning strategy
apiVersion: v1
kind: ConfigMap
metadata:
  name: mig-partition-config
  namespace: gpu-operator
data:
  mig-parted-config.yaml: |
    version: v1
    mig-configs:
      # 7 equal MIG instances (1g.10gb each)
      all-1g.10gb:
        - devices: all
          mig-enabled: true
          mig-devices:
            "1g.10gb": 7
      # 2 large instances (3g.20gb each) for heavy training
      all-3g.20gb:
        - devices: all
          mig-enabled: true
          mig-devices:
            "3g.20gb": 2
      # Mixed: 1 large + 4 small
      mixed:
        - devices: all
          mig-enabled: true
          mig-devices:
            "3g.20gb": 1
            "1g.10gb": 4
---
# Pod requesting a specific MIG instance
apiVersion: v1
kind: Pod
metadata:
  name: mig-inference-pod
  namespace: ml-workloads
spec:
  tolerations:
  - key: nvidia.com/gpu
    operator: Exists
    effect: NoSchedule
  containers:
  - name: inference
    image: nvcr.io/nvidia/tritonserver:23.10-py3
    resources:
      limits:
        nvidia.com/mig-1g.10gb: "1"
```

---

### 18. GPU Time-Slicing Configuration
Configure GPU time-slicing to allow multiple containers to share a single physical GPU by interleaving their compute access.

```yaml
# ConfigMap for time-slicing configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: time-slicing-config
  namespace: gpu-operator
data:
  any: |-
    version: v1
    flags:
      migStrategy: none
    sharing:
      timeSlicing:
        renameByDefault: false
        failRequestsGreaterThanOne: false
        resources:
        - name: nvidia.com/gpu
          replicas: 4   # 4 virtual GPUs per physical GPU
---
# Pod that requests a time-sliced (shared) GPU
apiVersion: v1
kind: Pod
metadata:
  name: timesliced-training
  namespace: ml-workloads
spec:
  tolerations:
  - key: nvidia.com/gpu
    operator: Exists
    effect: NoSchedule
  containers:
  - name: trainer
    image: gcr.io/my-gcp-project/trainer:latest
    resources:
      limits:
        nvidia.com/gpu: "1"   # Gets 1/4 of GPU time
```

---

### 19. GPU Autoscaling — Node Pool with Cluster Autoscaler
Enable cluster autoscaler on the GPU node pool and configure scale-from-zero so GPU nodes are provisioned on demand.

```bash
# Enable autoscaling on an existing GPU node pool
gcloud container node-pools update gpu-t4-pool \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=8

# Annotate node pool to allow scale-from-zero
# (GKE automatically detects GPU resource type for scale-from-zero)
kubectl get configmap cluster-autoscaler-status \
  -n kube-system \
  -o yaml | grep -A 5 "gpu-t4-pool"
```

---

### 20. Distributed Training — PyTorch with Multi-Node Job
Run a multi-node PyTorch distributed data parallel training job using the Kubernetes Job API with indexed completions.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: pytorch-ddp-training
  namespace: ml-workloads
spec:
  completionMode: Indexed
  completions: 4
  parallelism: 4
  template:
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      subdomain: pytorch-ddp-svc
      containers:
      - name: trainer
        image: us-central1-docker.pkg.dev/my-gcp-project/ml-images/pytorch-ddp:2.1
        command:
        - python3
        - -m
        - torch.distributed.run
        - --nproc_per_node=1
        - --nnodes=4
        - --node_rank=$(JOB_COMPLETION_INDEX)
        - --master_addr=pytorch-ddp-training-0.pytorch-ddp-svc
        - --master_port=23456
        - /app/train_ddp.py
        env:
        - name: JOB_COMPLETION_INDEX
          valueFrom:
            fieldRef:
              fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
        resources:
          limits:
            nvidia.com/gpu: "1"
      restartPolicy: OnFailure
---
apiVersion: v1
kind: Service
metadata:
  name: pytorch-ddp-svc
  namespace: ml-workloads
spec:
  clusterIP: None
  selector:
    job-name: pytorch-ddp-training
```

---

### 21. Vertex AI — Submit Training Job from GKE
Use Workload Identity from within a GKE pod to submit a custom training job to Vertex AI for managed training infrastructure.

```python
# submit_vertex_job.py — runs as a Kubernetes Job on GKE
from google.cloud import aiplatform
import os

PROJECT_ID = "my-gcp-project"
REGION = "us-central1"
STAGING_BUCKET = f"gs://{PROJECT_ID}-ml-staging"

aiplatform.init(project=PROJECT_ID, location=REGION, staging_bucket=STAGING_BUCKET)

job = aiplatform.CustomTrainingJob(
    display_name="bert-finetuning-v1",
    script_path="trainer/task.py",
    container_uri="us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.1-13:latest",
    requirements=["transformers==4.35.0", "datasets==2.14.0"],
    model_serving_container_image_uri=(
        "us-docker.pkg.dev/vertex-ai/prediction/pytorch-gpu.1-13:latest"
    ),
)

model = job.run(
    machine_type="n1-standard-8",
    accelerator_type="NVIDIA_TESLA_T4",
    accelerator_count=1,
    replica_count=1,
    args=["--epochs=5", "--batch-size=16", "--lr=2e-5"],
)
print(f"Training complete. Model: {model.resource_name}")
```

---

### 22. Vertex AI — Workload Identity for GKE to Vertex AI
Configure Workload Identity so GKE pods can access Vertex AI APIs without storing service account keys as secrets.

```bash
# 1. Create a Google Service Account
gcloud iam service-accounts create gke-vertex-sa \
  --project=my-gcp-project \
  --display-name="GKE Vertex AI Service Account"

# 2. Grant Vertex AI User role
gcloud projects add-iam-policy-binding my-gcp-project \
  --member="serviceAccount:gke-vertex-sa@my-gcp-project.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# 3. Bind Kubernetes SA to Google SA
gcloud iam service-accounts add-iam-policy-binding \
  gke-vertex-sa@my-gcp-project.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:my-gcp-project.svc.id.goog[ml-workloads/trainer-ksa]"

# 4. Create Kubernetes SA with annotation
kubectl create serviceaccount trainer-ksa -n ml-workloads
kubectl annotate serviceaccount trainer-ksa \
  -n ml-workloads \
  iam.gke.io/gcp-service-account=gke-vertex-sa@my-gcp-project.iam.gserviceaccount.com
```

---

### 23. Model Serving — Deploy with NVIDIA Triton Inference Server
Deploy NVIDIA Triton Inference Server on GKE for high-throughput, low-latency model serving with GPU acceleration.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: triton-server
  namespace: ml-workloads
spec:
  replicas: 2
  selector:
    matchLabels:
      app: triton-server
  template:
    metadata:
      labels:
        app: triton-server
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: triton
        image: nvcr.io/nvidia/tritonserver:23.10-py3
        command:
        - tritonserver
        - --model-repository=gs://my-gcp-project-models/triton-repo
        - --strict-model-config=false
        - --log-verbose=1
        ports:
        - containerPort: 8000
          name: http
        - containerPort: 8001
          name: grpc
        - containerPort: 8002
          name: metrics
        resources:
          limits:
            nvidia.com/gpu: "1"
        readinessProbe:
          httpGet:
            path: /v2/health/ready
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        volumeMounts:
        - name: dshm
          mountPath: /dev/shm
      volumes:
      - name: dshm
        emptyDir:
          medium: Memory
          sizeLimit: 8Gi
      serviceAccountName: trainer-ksa
---
apiVersion: v1
kind: Service
metadata:
  name: triton-server
  namespace: ml-workloads
spec:
  selector:
    app: triton-server
  ports:
  - name: http
    port: 8000
    targetPort: 8000
  - name: grpc
    port: 8001
    targetPort: 8001
  - name: metrics
    port: 8002
    targetPort: 8002
```

---

### 24. Model Serving — ONNX Model on Triton
Configure Triton Inference Server to serve an ONNX model with GPU execution provider for optimized inference.

```bash
# Create model repository structure in GCS
gsutil mkdir gs://my-gcp-project-models/triton-repo/resnet50/1/

# Upload ONNX model
gsutil cp resnet50.onnx \
  gs://my-gcp-project-models/triton-repo/resnet50/1/model.onnx

# Create model config
cat > /tmp/config.pbtxt <<'EOF'
name: "resnet50"
backend: "onnxruntime"
max_batch_size: 32

input [
  {
    name: "input"
    data_type: TYPE_FP32
    dims: [3, 224, 224]
  }
]

output [
  {
    name: "output"
    data_type: TYPE_FP32
    dims: [1000]
  }
]

instance_group [
  {
    kind: KIND_GPU
    count: 1
    gpus: [0]
  }
]

dynamic_batching {
  preferred_batch_size: [8, 16, 32]
  max_queue_delay_microseconds: 5000
}
EOF

gsutil cp /tmp/config.pbtxt \
  gs://my-gcp-project-models/triton-repo/resnet50/config.pbtxt
```

---

### 25. Kubernetes Job with GPU Completions (Parallel GPU Jobs)
Run multiple parallel GPU jobs where each completion uses one GPU, enabling efficient batch inference at scale.

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-inference
  namespace: ml-workloads
spec:
  completions: 20
  parallelism: 4       # 4 pods at a time (one GPU each)
  completionMode: NonIndexed
  template:
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: inference-worker
        image: gcr.io/my-gcp-project/batch-inference:latest
        command:
        - python3
        - /app/run_inference.py
        - --input-bucket=gs://my-gcp-project-data/inputs
        - --output-bucket=gs://my-gcp-project-data/outputs
        resources:
          requests:
            cpu: "4"
            memory: 16Gi
            nvidia.com/gpu: "1"
          limits:
            nvidia.com/gpu: "1"
        env:
        - name: CUDA_VISIBLE_DEVICES
          value: "0"
      restartPolicy: OnFailure
      serviceAccountName: trainer-ksa
```

---

### 26. PodAffinity — Co-locate Data-Loader and Trainer Pods
Use pod affinity rules to schedule data-loader pods on the same node as trainer pods to minimize data transfer latency.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: data-loader
  namespace: ml-workloads
spec:
  replicas: 2
  selector:
    matchLabels:
      app: data-loader
  template:
    metadata:
      labels:
        app: data-loader
    spec:
      affinity:
        podAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values: ["trainer"]
            topologyKey: kubernetes.io/hostname
      containers:
      - name: data-loader
        image: gcr.io/my-gcp-project/data-loader:latest
        resources:
          requests:
            cpu: "4"
            memory: 32Gi
          limits:
            cpu: "8"
            memory: 64Gi
```

---

### 27. Node Taint for GPU-Only Workloads
Apply taints to GPU nodes to prevent non-GPU workloads from being scheduled there and wasting GPU-attached node capacity.

```bash
# Taint all GPU nodes (applied automatically via node pool config)
kubectl taint nodes \
  -l cloud.google.com/gke-accelerator=nvidia-tesla-t4 \
  nvidia.com/gpu=present:NoSchedule

# Toleration in workload manifest
cat <<'EOF'
spec:
  tolerations:
  - key: "nvidia.com/gpu"
    operator: "Equal"
    value: "present"
    effect: "NoSchedule"
EOF
```

---

### 28. Preemptible GPU Instances — Spot GPU Node Pool
Create a spot GPU node pool for cost-sensitive training workloads that can tolerate interruptions.

```bash
gcloud container node-pools create spot-gpu-t4-pool \
  --cluster=my-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --machine-type=n1-standard-8 \
  --accelerator=type=nvidia-tesla-t4,count=1 \
  --spot \
  --num-nodes=0 \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=16 \
  --node-taints=nvidia.com/gpu=present:NoSchedule,cloud.google.com/gke-spot=true:NoSchedule \
  --node-labels=gpu-pool=spot,accelerator-type=t4
```

---

### 29. GPU Memory Limits — Prevent OOM in Containers
Set GPU memory fraction environment variables to prevent CUDA OOM errors when multiple containers share GPU memory.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: memory-safe-trainer
  namespace: ml-workloads
spec:
  tolerations:
  - key: nvidia.com/gpu
    operator: Exists
    effect: NoSchedule
  containers:
  - name: trainer
    image: gcr.io/my-gcp-project/tf-trainer:latest
    env:
    # TensorFlow: limit GPU memory fraction to 80%
    - name: TF_FORCE_GPU_ALLOW_GROWTH
      value: "true"
    # PyTorch: set max split size to reduce fragmentation
    - name: PYTORCH_CUDA_ALLOC_CONF
      value: "max_split_size_mb:512"
    # Limit visible GPUs to the assigned one
    - name: CUDA_VISIBLE_DEVICES
      value: "0"
    resources:
      limits:
        nvidia.com/gpu: "1"
        memory: "14Gi"   # Leave headroom for CUDA runtime
```

---

### 30. HPA for GPU-Based Inference Service (Custom RPS Metric)
Scale the Triton inference deployment horizontally based on requests-per-second using a custom Prometheus metric.

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: triton-server-hpa
  namespace: ml-workloads
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: triton-server
  minReplicas: 1
  maxReplicas: 8
  metrics:
  - type: Pods
    pods:
      metric:
        name: triton_inference_request_success_total
      target:
        type: AverageValue
        averageValue: "100"    # Scale when > 100 RPS per pod
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Pods
        value: 1
        periodSeconds: 120
```

---

## Nested

### 31. KCC — ContainerNodePool with GPU Accelerator Config
Declare a T4 GPU node pool as a Config Connector resource so it is managed declaratively and version-controlled.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: gpu-t4-node-pool
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  initialNodeCount: 0
  autoscaling:
    minNodeCount: 0
    maxNodeCount: 8
  management:
    autoRepair: true
    autoUpgrade: true
  nodeConfig:
    machineType: n1-standard-4
    diskSizeGb: 100
    diskType: pd-ssd
    oauthScopes:
    - "https://www.googleapis.com/auth/cloud-platform"
    guestAccelerators:
    - type: nvidia-tesla-t4
      count: 1
    taints:
    - key: nvidia.com/gpu
      value: present
      effect: NO_SCHEDULE
    labels:
      accelerator-type: t4
      pool-type: gpu
    metadata:
      install-nvidia-driver: "true"
```

---

### 32. KCC — ContainerNodePool for MIG A100 Pool
Define an A100 MIG-enabled node pool using Config Connector with the appropriate machine type and accelerator configuration.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: gpu-a100-mig-pool
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  initialNodeCount: 0
  autoscaling:
    minNodeCount: 0
    maxNodeCount: 4
  management:
    autoRepair: true
    autoUpgrade: false   # Pin version for MIG stability
  nodeConfig:
    machineType: a2-highgpu-1g
    diskSizeGb: 200
    diskType: pd-ssd
    oauthScopes:
    - "https://www.googleapis.com/auth/cloud-platform"
    guestAccelerators:
    - type: nvidia-tesla-a100
      count: 1
      gpuPartitionSize: "1g.10gb"    # MIG partition profile
    taints:
    - key: nvidia.com/gpu
      value: present
      effect: NO_SCHEDULE
    labels:
      accelerator-type: a100
      mig-enabled: "true"
    metadata:
      install-nvidia-driver: "true"
```

---

### 33. KCC — Workload Identity Binding for Vertex AI Access
Create the IAM binding that allows the Kubernetes service account in ml-workloads namespace to impersonate the Google SA for Vertex AI.

```yaml
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMServiceAccount
metadata:
  name: gke-vertex-sa
  namespace: config-connector
spec:
  displayName: "GKE Vertex AI Service Account"
  description: "Used by GKE ML workloads to access Vertex AI APIs"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPartialPolicy
metadata:
  name: gke-vertex-sa-wi-binding
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: iam.cnrm.cloud.google.com/v1beta1
    kind: IAMServiceAccount
    name: gke-vertex-sa
  bindings:
  - role: roles/iam.workloadIdentityUser
    members:
    - member: "serviceAccount:my-gcp-project.svc.id.goog[ml-workloads/trainer-ksa]"
---
apiVersion: iam.cnrm.cloud.google.com/v1beta1
kind: IAMPolicyMember
metadata:
  name: vertex-ai-user-binding
  namespace: config-connector
spec:
  resourceRef:
    apiVersion: resourcemanager.cnrm.cloud.google.com/v1beta1
    kind: Project
    external: projects/my-gcp-project
  role: roles/aiplatform.user
  member: "serviceAccount:gke-vertex-sa@my-gcp-project.iam.gserviceaccount.com"
```

---

### 34. KCC — StorageBucket for ML Model Artifacts
Provision a GCS bucket for storing trained model artifacts and checkpoints with versioning and lifecycle rules.

```yaml
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: ml-model-artifacts
  namespace: config-connector
  labels:
    purpose: ml-models
    team: ml-platform
spec:
  resourceID: my-gcp-project-ml-models
  location: US
  storageClass: STANDARD
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  lifecycleRule:
  - action:
      type: SetStorageClass
      storageClass: NEARLINE
    condition:
      age: 90
      matchesStorageClass:
      - STANDARD
  - action:
      type: Delete
    condition:
      age: 365
      isLive: false
      numNewerVersions: 3
  cors:
  - origin: ["https://my-internal-dashboard.my-company.com"]
    method: ["GET"]
    maxAgeSeconds: 3600
```

---

### 35. KCC — PubSubTopic for Training Job Notifications
Create a Pub/Sub topic that receives notifications when ML training jobs complete or fail on GKE or Vertex AI.

```yaml
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubTopic
metadata:
  name: ml-training-notifications
  namespace: config-connector
  labels:
    purpose: ml-job-notifications
spec:
  messageRetentionDuration: "86400s"
---
apiVersion: pubsub.cnrm.cloud.google.com/v1beta1
kind: PubSubSubscription
metadata:
  name: ml-training-slack-sub
  namespace: config-connector
spec:
  topicRef:
    name: ml-training-notifications
  pushConfig:
    pushEndpoint: "https://us-central1-my-gcp-project.cloudfunctions.net/notify-slack"
    oidcToken:
      serviceAccountEmail: pubsub-invoker@my-gcp-project.iam.gserviceaccount.com
  ackDeadlineSeconds: 30
  retryPolicy:
    minimumBackoff: "10s"
    maximumBackoff: "600s"
```

---

### 36. KCC — MonitoringAlertPolicy for GPU Utilization
Define a Cloud Monitoring alert policy that fires when GPU utilization drops below 20% for extended periods, indicating idle GPU waste.

```yaml
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: gpu-low-utilization-alert
  namespace: config-connector
spec:
  displayName: "GKE GPU Low Utilization Alert"
  documentation:
    content: |
      GPU utilization is below 20% for 30+ minutes.
      Check for idle training pods or misconfigured workloads.
    mimeType: text/markdown
  conditions:
  - displayName: "GPU utilization below 20%"
    conditionThreshold:
      filter: |
        resource.type="k8s_node"
        AND metric.type="kubernetes.io/node/accelerator/duty_cycle"
      aggregations:
      - alignmentPeriod: "300s"
        crossSeriesReducer: REDUCE_MEAN
        perSeriesAligner: ALIGN_MEAN
      comparison: COMPARISON_LT
      thresholdValue: 0.2
      duration: "1800s"
  alertStrategy:
    notificationRateLimit:
      period: "3600s"
  notificationChannels: []
  severity: WARNING
  combiner: OR
```

---

### 37. KCC — ArtifactRegistryRepository for ML Container Images
Provision an Artifact Registry Docker repository for storing versioned ML training and serving container images.

```yaml
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: ml-images-repo
  namespace: config-connector
  labels:
    purpose: ml-container-images
    team: ml-platform
spec:
  location: us-central1
  format: DOCKER
  description: "ML training and serving container images"
  cleanupPolicies:
  - id: keep-last-10-versions
    action: KEEP
    mostRecentVersions:
      keepCount: 10
  - id: delete-old-untagged
    action: DELETE
    condition:
      olderThan: 2592000s   # 30 days
      tagState: UNTAGGED
```

---

### 38. KCC — ContainerCluster with GPU Node Auto-Provisioning
Declare a GKE cluster that can automatically provision GPU node pools when GPU-requesting pods are unschedulable.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: my-cluster
  namespace: config-connector
spec:
  location: us-central1
  initialNodeCount: 1
  removeDefaultNodePool: true
  clusterAutoscaling:
    autoscalingProfile: OPTIMIZE_UTILIZATION
    enableNodeAutoprovisioning: true
    resourceLimits:
    - resourceType: cpu
      minimum: 4
      maximum: 128
    - resourceType: memory
      minimum: 16
      maximum: 512
    - resourceType: nvidia.com/gpu
      minimum: 0
      maximum: 16
    autoprovisioningNodePoolDefaults:
      oauthScopes:
      - "https://www.googleapis.com/auth/cloud-platform"
      management:
        autoRepair: true
        autoUpgrade: true
  workloadIdentityConfig:
    workloadPool: "my-gcp-project.svc.id.goog"
  addonsConfig:
    gcePersistentDiskCsiDriverConfig:
      enabled: true
```

---

### 39. KCC — BigQueryDataset for ML Experiment Tracking
Create a BigQuery dataset to store ML experiment results, hyperparameters, and training metrics for analysis and comparison.

```yaml
apiVersion: bigquery.cnrm.cloud.google.com/v1beta1
kind: BigQueryDataset
metadata:
  name: ml-experiment-tracking
  namespace: config-connector
  labels:
    purpose: ml-experiment-tracking
    team: ml-platform
spec:
  resourceID: ml_experiments
  location: US
  description: "ML experiment tracking: metrics, hyperparameters, and model lineage"
  defaultTableExpirationMs: 31536000000   # 1 year
  access:
  - role: OWNER
    specialGroup: projectOwners
  - role: WRITER
    userByEmail: gke-vertex-sa@my-gcp-project.iam.gserviceaccount.com
  - role: READER
    specialGroup: projectReaders
```

---

### 40. KCC — CloudSchedulerJob for Periodic Batch Training
Create a Cloud Scheduler job via Config Connector that triggers a weekly retraining pipeline for scheduled ML model updates.

```yaml
apiVersion: cloudscheduler.cnrm.cloud.google.com/v1beta1
kind: CloudSchedulerJob
metadata:
  name: weekly-model-retraining
  namespace: config-connector
spec:
  location: us-central1
  description: "Trigger weekly ML model retraining every Sunday at 2am"
  schedule: "0 2 * * 0"
  timeZone: "UTC"
  httpTarget:
    uri: "https://us-central1-my-gcp-project.cloudfunctions.net/trigger-training-pipeline"
    httpMethod: POST
    body: "eyJtb2RlbCI6InJlY29tbWVuZGF0aW9uLXYyIiwiZGF0YXNldCI6ImxhdGVzdCJ9"
    headers:
      Content-Type: application/json
    oidcToken:
      serviceAccountRef:
        name: scheduler-sa
      audience: "https://us-central1-my-gcp-project.cloudfunctions.net/trigger-training-pipeline"
  retryConfig:
    retryCount: 2
    minBackoffDuration: "30s"
    maxBackoffDuration: "600s"
    maxDoublings: 3
```

---

## Advanced

### 41. Full ML Training Pipeline: GKE GPU + Vertex AI + KCC + Workload Identity
Deploy a complete end-to-end ML training pipeline that uses GKE for data preprocessing, Vertex AI for distributed training, and KCC for infrastructure management.

```yaml
# Infrastructure stack: KCC-managed components
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: data-prep-pool
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  autoscaling:
    minNodeCount: 0
    maxNodeCount: 10
  nodeConfig:
    machineType: n2-highmem-16
    labels:
      workload-type: data-prep
---
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: gpu-training-pool
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  autoscaling:
    minNodeCount: 0
    maxNodeCount: 8
  nodeConfig:
    machineType: n1-standard-8
    guestAccelerators:
    - type: nvidia-tesla-t4
      count: 2
    taints:
    - key: nvidia.com/gpu
      value: present
      effect: NO_SCHEDULE
```

```python
# Pipeline orchestrator: pipeline.py
# Runs as a GKE CronJob, uses Workload Identity to access GCS + Vertex AI

import subprocess
from google.cloud import storage, aiplatform

def run_pipeline():
    PROJECT = "my-gcp-project"
    REGION  = "us-central1"
    BUCKET  = f"gs://{PROJECT}-ml-staging"

    # Step 1: Submit data preprocessing Job to GKE
    subprocess.run([
        "kubectl", "apply", "-f", "/pipelines/data-prep-job.yaml"
    ], check=True)

    # Step 2: Wait for data prep completion
    subprocess.run([
        "kubectl", "wait", "--for=condition=complete",
        "job/data-prep", "-n", "ml-workloads", "--timeout=3600s"
    ], check=True)

    # Step 3: Submit distributed training to Vertex AI
    aiplatform.init(project=PROJECT, location=REGION, staging_bucket=BUCKET)

    job = aiplatform.CustomTrainingJob(
        display_name="pipeline-training",
        script_path="trainer/task.py",
        container_uri="us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-0:latest",
    )
    model = job.run(
        machine_type="n1-standard-8",
        accelerator_type="NVIDIA_TESLA_T4",
        accelerator_count=2,
        replica_count=4,
    )
    print(f"Model resource: {model.resource_name}")
    return model

if __name__ == "__main__":
    run_pipeline()
```

---

### 42. Multi-Node Distributed Training: PyTorch DDP with NCCL Across GPU Pods
Configure a production-grade PyTorch Distributed Data Parallel training job with NCCL backend for efficient all-reduce operations across multiple GPU nodes.

```yaml
# Headless service for pod-to-pod NCCL communication
apiVersion: v1
kind: Service
metadata:
  name: ddp-master-svc
  namespace: ml-workloads
spec:
  clusterIP: None
  selector:
    job-name: pytorch-ddp-nccl
  ports:
  - port: 23456
    targetPort: 23456
---
apiVersion: batch/v1
kind: Job
metadata:
  name: pytorch-ddp-nccl
  namespace: ml-workloads
spec:
  completionMode: Indexed
  completions: 8
  parallelism: 8
  template:
    metadata:
      labels:
        app: ddp-trainer
    spec:
      subdomain: ddp-master-svc
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: ddp-trainer
              topologyKey: kubernetes.io/hostname
      containers:
      - name: ddp-trainer
        image: us-central1-docker.pkg.dev/my-gcp-project/ml-images/pytorch-nccl:2.1
        command:
        - torchrun
        - --nproc_per_node=1
        - --nnodes=8
        - --node_rank=$(JOB_COMPLETION_INDEX)
        - --master_addr=pytorch-ddp-nccl-0.ddp-master-svc.ml-workloads.svc.cluster.local
        - --master_port=23456
        - --rdzv_backend=c10d
        - /app/train_ddp.py
        - --model=gpt2-large
        - --batch-size=32
        env:
        - name: JOB_COMPLETION_INDEX
          valueFrom:
            fieldRef:
              fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
        - name: NCCL_DEBUG
          value: INFO
        - name: NCCL_IB_DISABLE
          value: "1"
        - name: NCCL_SOCKET_IFNAME
          value: eth0
        resources:
          requests:
            nvidia.com/gpu: "1"
            cpu: "8"
            memory: 32Gi
          limits:
            nvidia.com/gpu: "1"
        volumeMounts:
        - name: dshm
          mountPath: /dev/shm
      volumes:
      - name: dshm
        emptyDir:
          medium: Memory
          sizeLimit: 16Gi
      restartPolicy: OnFailure
      serviceAccountName: trainer-ksa
```

---

### 43. GPUDirect RDMA — Configure High-Bandwidth GPU-to-GPU Communication
Enable GPUDirect RDMA on GKE for direct GPU memory transfers between nodes, eliminating CPU bottlenecks in distributed training.

```bash
# GPUDirect requires A3 (H100) or A2 (A100) machine types with RDMA networking
# Create the high-bandwidth cluster
gcloud container clusters create gpu-rdma-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --machine-type=a3-highgpu-8g \
  --num-nodes=0 \
  --enable-dataplane-v2 \
  --enable-ip-alias

# Create the GPU pool with GPUDirect support
gcloud container node-pools create h100-rdma-pool \
  --cluster=gpu-rdma-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --machine-type=a3-highgpu-8g \
  --accelerator=type=nvidia-h100-80gb,count=8,gpu-driver-version=latest \
  --num-nodes=4 \
  --enable-gvnic
```

```yaml
# Job using GPUDirect RDMA with NCCL
apiVersion: batch/v1
kind: Job
metadata:
  name: h100-rdma-training
  namespace: ml-workloads
spec:
  completionMode: Indexed
  completions: 4
  parallelism: 4
  template:
    spec:
      containers:
      - name: trainer
        image: nvcr.io/nvidia/pytorch:23.10-py3
        command: ["torchrun"]
        args:
        - "--nproc_per_node=8"
        - "--nnodes=4"
        - "--node_rank=$(JOB_COMPLETION_INDEX)"
        - "--master_addr=h100-rdma-training-0.rdma-svc"
        - "--master_port=29500"
        - "/app/train_large_model.py"
        env:
        - name: JOB_COMPLETION_INDEX
          valueFrom:
            fieldRef:
              fieldPath: metadata.annotations['batch.kubernetes.io/job-completion-index']
        - name: NCCL_P2P_LEVEL
          value: "NVL"
        - name: NCCL_NET_GDR_LEVEL
          value: "SYS"
        - name: NCCL_CROSS_NIC
          value: "0"
        resources:
          limits:
            nvidia.com/gpu: "8"
            vpc.googleapis.com/nic: "8"  # RDMA NICs
      restartPolicy: OnFailure
```

---

### 44. Inference Serving at Scale: Triton + HPA + Cloud Monitoring Autoscaling
Deploy a production inference service that combines Triton Inference Server with HPA driven by custom GPU utilization metrics from Cloud Monitoring.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: triton-prod
  namespace: ml-workloads
  labels:
    app: triton-prod
    version: v2
spec:
  replicas: 2
  selector:
    matchLabels:
      app: triton-prod
  template:
    metadata:
      labels:
        app: triton-prod
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8002"
    spec:
      tolerations:
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: triton-prod
            topologyKey: kubernetes.io/hostname
      containers:
      - name: triton
        image: nvcr.io/nvidia/tritonserver:23.10-py3
        args:
        - tritonserver
        - --model-repository=gs://my-gcp-project-models/prod-triton-repo
        - --strict-model-config=false
        - --grpc-port=8001
        - --http-port=8000
        - --metrics-port=8002
        - --allow-grpc=true
        - --log-info=true
        ports:
        - containerPort: 8000
        - containerPort: 8001
        - containerPort: 8002
        resources:
          requests:
            cpu: "6"
            memory: 24Gi
            nvidia.com/gpu: "1"
          limits:
            nvidia.com/gpu: "1"
        readinessProbe:
          httpGet:
            path: /v2/health/ready
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 5
          failureThreshold: 3
        livenessProbe:
          httpGet:
            path: /v2/health/live
            port: 8000
          initialDelaySeconds: 90
          periodSeconds: 15
        volumeMounts:
        - name: shm
          mountPath: /dev/shm
      volumes:
      - name: shm
        emptyDir:
          medium: Memory
          sizeLimit: 12Gi
      serviceAccountName: trainer-ksa
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: triton-prod-hpa
  namespace: ml-workloads
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: triton-prod
  minReplicas: 2
  maxReplicas: 16
  metrics:
  - type: External
    external:
      metric:
        name: kubernetes.io/node/accelerator/duty_cycle
      target:
        type: AverageValue
        averageValue: "80"
  - type: Pods
    pods:
      metric:
        name: nv_inference_queue_duration_us
      target:
        type: AverageValue
        averageValue: "5000"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Pods
        value: 2
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 600
```

---

### 45. MLOps on GKE: Kubeflow Pipelines for End-to-End ML Workflow
Deploy Kubeflow Pipelines on GKE and define a complete MLOps pipeline that covers data validation, training, evaluation, and model deployment.

```python
# mlops_pipeline.py — Kubeflow Pipelines v2 SDK
from kfp import dsl
from kfp import compiler
from google.cloud import aiplatform

@dsl.component(
    base_image="python:3.11",
    packages_to_install=["pandas", "google-cloud-storage"]
)
def data_validation(
    input_bucket: str,
    output_dataset: dsl.Output[dsl.Dataset]
):
    import pandas as pd
    from google.cloud import storage
    gcs = storage.Client()
    # ... validate and write to output_dataset.path
    print("Data validation complete")

@dsl.component(
    base_image="us-central1-docker.pkg.dev/my-gcp-project/ml-images/pytorch-trainer:2.1"
)
def model_training(
    dataset: dsl.Input[dsl.Dataset],
    model: dsl.Output[dsl.Model],
    epochs: int = 10,
    learning_rate: float = 1e-4
):
    import torch
    print(f"Training with GPU: {torch.cuda.is_available()}")
    # ... training logic

@dsl.component(
    base_image="python:3.11",
    packages_to_install=["google-cloud-aiplatform"]
)
def model_evaluation(
    model: dsl.Input[dsl.Model],
    metrics: dsl.Output[dsl.Metrics]
) -> float:
    accuracy = 0.0
    # ... evaluation logic
    metrics.log_metric("accuracy", accuracy)
    return accuracy

@dsl.component(
    base_image="python:3.11",
    packages_to_install=["google-cloud-aiplatform"]
)
def model_deployment(
    model: dsl.Input[dsl.Model],
    accuracy: float,
    accuracy_threshold: float = 0.90
):
    from google.cloud import aiplatform
    if accuracy < accuracy_threshold:
        raise ValueError(f"Model accuracy {accuracy} below threshold {accuracy_threshold}")
    aiplatform.init(project="my-gcp-project", location="us-central1")
    uploaded = aiplatform.Model.upload(
        display_name="production-model",
        artifact_uri=model.uri,
        serving_container_image_uri=(
            "us-docker.pkg.dev/vertex-ai/prediction/pytorch-gpu.2-0:latest"
        )
    )
    endpoint = uploaded.deploy(
        machine_type="n1-standard-4",
        accelerator_type="NVIDIA_TESLA_T4",
        accelerator_count=1,
        min_replica_count=2,
        max_replica_count=10,
    )
    print(f"Deployed to endpoint: {endpoint.resource_name}")

@dsl.pipeline(
    name="ml-production-pipeline",
    description="End-to-end MLOps pipeline: validate → train → evaluate → deploy"
)
def mlops_pipeline(
    input_bucket: str = "gs://my-gcp-project-data/training",
    epochs: int = 20,
    learning_rate: float = 2e-5,
    accuracy_threshold: float = 0.92
):
    validate_task = data_validation(input_bucket=input_bucket)

    train_task = model_training(
        dataset=validate_task.outputs["output_dataset"],
        epochs=epochs,
        learning_rate=learning_rate
    )
    train_task.set_gpu_limit(1)
    train_task.set_memory_limit("32G")
    train_task.add_node_selector_constraint("cloud.google.com/gke-accelerator", "nvidia-tesla-t4")

    eval_task = model_evaluation(model=train_task.outputs["model"])

    model_deployment(
        model=train_task.outputs["model"],
        accuracy=eval_task.output,
        accuracy_threshold=accuracy_threshold
    )

compiler.Compiler().compile(mlops_pipeline, "mlops_pipeline.yaml")
```

---

### 46. TPU Node Pool — Create and Use TPU Pods for JAX/TF Training
Create a TPU v4 node pool on GKE and run a JAX distributed training workload across TPU slices.

```bash
# Create GKE cluster with TPU support
gcloud container clusters create tpu-training-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --release-channel=regular \
  --workload-pool=my-gcp-project.svc.id.goog

# Create TPU v4 node pool (TPU pods)
gcloud container node-pools create tpu-v4-pool \
  --cluster=tpu-training-cluster \
  --region=us-central1 \
  --project=my-gcp-project \
  --machine-type=ct4p-hightpu-4t \
  --tpu-topology=2x2x2 \
  --num-nodes=2 \
  --enable-autoscaling \
  --min-nodes=0 \
  --max-nodes=4
```

```yaml
# JAX training job on TPUs
apiVersion: batch/v1
kind: Job
metadata:
  name: jax-tpu-training
  namespace: ml-workloads
spec:
  completions: 1
  template:
    spec:
      nodeSelector:
        cloud.google.com/gke-tpu-accelerator: tpu-v4-podslice
        cloud.google.com/gke-tpu-topology: 2x2x2
      containers:
      - name: jax-trainer
        image: us-docker.pkg.dev/vertex-ai/training/tpu-vm-tf-2.14.0:latest
        command:
        - python3
        - /app/train_jax.py
        - --model=t5-large
        - --tpu-topology=2x2x2
        env:
        - name: TPU_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        resources:
          requests:
            google.com/tpu: "4"
          limits:
            google.com/tpu: "4"
      restartPolicy: OnFailure
      serviceAccountName: trainer-ksa
```

---

### 47. Model Versioning: Artifact Registry + GCS Versioned Model Store via KCC
Implement a complete model versioning system using Artifact Registry for container images and GCS with object versioning for model weights.

```yaml
# Artifact Registry for versioned ML container images
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: ml-models-registry
  namespace: config-connector
spec:
  location: us-central1
  format: DOCKER
  description: "Versioned ML model serving images"
  cleanupPolicies:
  - id: keep-tagged-versions
    action: KEEP
    condition:
      tagState: TAGGED
  - id: delete-untagged-after-7d
    action: DELETE
    condition:
      olderThan: 604800s
      tagState: UNTAGGED
---
# GCS bucket with versioning for model weights
apiVersion: storage.cnrm.cloud.google.com/v1beta1
kind: StorageBucket
metadata:
  name: versioned-model-store
  namespace: config-connector
spec:
  resourceID: my-gcp-project-model-store
  location: US
  uniformBucketLevelAccess: true
  versioning:
    enabled: true
  lifecycleRule:
  - action:
      type: SetStorageClass
      storageClass: NEARLINE
    condition:
      age: 30
      matchesStorageClass: [STANDARD]
  - action:
      type: Delete
    condition:
      isLive: false
      numNewerVersions: 5
      age: 90
```

```bash
# Tag and push a new model version
MODEL_VERSION="v$(date +%Y%m%d%H%M%S)"

docker build -t \
  us-central1-docker.pkg.dev/my-gcp-project/ml-models-registry/resnet50:${MODEL_VERSION} \
  ./serving/

docker push \
  us-central1-docker.pkg.dev/my-gcp-project/ml-models-registry/resnet50:${MODEL_VERSION}

# Also upload model weights to GCS with a versioned path
gsutil -m cp -r ./model_weights/ \
  gs://my-gcp-project-model-store/resnet50/${MODEL_VERSION}/

echo "Model version ${MODEL_VERSION} published"
```

---

### 48. GPU Quota Management: ResourceQuota + LimitRange for Fair GPU Sharing
Implement a fair GPU sharing policy across multiple teams using ResourceQuota and LimitRange to prevent any one team from monopolizing GPU resources.

```yaml
# Team namespaces with GPU quotas
apiVersion: v1
kind: Namespace
metadata:
  name: team-ml-research
  labels:
    team: ml-research
    gpu-tier: research
---
apiVersion: v1
kind: Namespace
metadata:
  name: team-ml-prod
  labels:
    team: ml-prod
    gpu-tier: production
---
# Research team: 4 GPUs max
apiVersion: v1
kind: ResourceQuota
metadata:
  name: research-gpu-quota
  namespace: team-ml-research
spec:
  hard:
    requests.nvidia.com/gpu: "4"
    limits.nvidia.com/gpu: "4"
    requests.cpu: "16"
    requests.memory: 64Gi
    limits.cpu: "32"
    limits.memory: 128Gi
    count/jobs.batch: "20"
    persistentvolumeclaims: "10"
    requests.storage: 2Ti
---
# Production team: 8 GPUs max
apiVersion: v1
kind: ResourceQuota
metadata:
  name: prod-gpu-quota
  namespace: team-ml-prod
spec:
  hard:
    requests.nvidia.com/gpu: "8"
    limits.nvidia.com/gpu: "8"
    requests.cpu: "32"
    requests.memory: 128Gi
---
# LimitRange: prevent single pods from hoarding all GPUs
apiVersion: v1
kind: LimitRange
metadata:
  name: gpu-limit-range
  namespace: team-ml-research
spec:
  limits:
  - type: Container
    max:
      nvidia.com/gpu: "2"    # Max 2 GPUs per container
    default:
      nvidia.com/gpu: "1"
    defaultRequest:
      nvidia.com/gpu: "1"
  - type: Pod
    max:
      nvidia.com/gpu: "2"    # Max 2 GPUs per pod
```

---

### 49. Spot GPU Training with Checkpointing: Save State on SIGTERM, Resume on Restart
Implement a production-grade spot GPU training loop that checkpoints model weights to GCS on preemption and automatically resumes from the latest checkpoint.

```python
# spot_gpu_trainer.py — complete checkpointing trainer for spot GPU pods

import os
import sys
import signal
import time
import torch
import torch.nn as nn
from google.cloud import storage
from pathlib import Path

PROJECT      = "my-gcp-project"
BUCKET_NAME  = f"{PROJECT}-training-checkpoints"
JOB_NAME     = os.environ.get("JOB_NAME", "default-job")
CHECKPOINT_KEY = f"checkpoints/{JOB_NAME}/latest.pt"
LOCAL_CKPT   = "/tmp/checkpoint.pt"
DEVICE       = "cuda" if torch.cuda.is_available() else "cpu"

class SpotTrainer:
    def __init__(self, model, optimizer, train_loader):
        self.model       = model.to(DEVICE)
        self.optimizer   = optimizer
        self.loader      = train_loader
        self.start_epoch = 0
        self.gcs         = storage.Client()
        self.bucket      = self.gcs.bucket(BUCKET_NAME)
        self._shutdown   = False
        signal.signal(signal.SIGTERM, self._on_sigterm)

    def _on_sigterm(self, sig, frame):
        print(f"[SIGTERM] Spot reclaim detected. Saving checkpoint...", flush=True)
        self._shutdown = True
        self._save_checkpoint(emergency=True)
        print("[SIGTERM] Checkpoint saved. Exiting.", flush=True)
        sys.exit(0)

    def _save_checkpoint(self, epoch=0, loss=0.0, emergency=False):
        state = {
            "epoch": epoch,
            "loss":  loss,
            "model_state_dict": self.model.state_dict(),
            "optimizer_state_dict": self.optimizer.state_dict(),
            "emergency": emergency,
        }
        torch.save(state, LOCAL_CKPT)
        blob = self.bucket.blob(CHECKPOINT_KEY)
        blob.upload_from_filename(LOCAL_CKPT)
        print(f"[CKPT] Saved epoch={epoch} loss={loss:.4f} emergency={emergency}")

    def load_checkpoint(self):
        blob = self.bucket.blob(CHECKPOINT_KEY)
        if blob.exists():
            blob.download_to_filename(LOCAL_CKPT)
            ckpt = torch.load(LOCAL_CKPT, map_location=DEVICE)
            self.model.load_state_dict(ckpt["model_state_dict"])
            self.optimizer.load_state_dict(ckpt["optimizer_state_dict"])
            self.start_epoch = ckpt["epoch"] + 1
            print(f"[CKPT] Resumed from epoch={self.start_epoch}")

    def train(self, total_epochs=100, ckpt_interval=5):
        self.load_checkpoint()
        criterion = nn.CrossEntropyLoss()
        for epoch in range(self.start_epoch, total_epochs):
            if self._shutdown:
                break
            running_loss = 0.0
            for batch in self.loader:
                if self._shutdown:
                    break
                inputs, labels = batch[0].to(DEVICE), batch[1].to(DEVICE)
                self.optimizer.zero_grad()
                outputs = self.model(inputs)
                loss    = criterion(outputs, labels)
                loss.backward()
                self.optimizer.step()
                running_loss += loss.item()
            avg_loss = running_loss / len(self.loader)
            print(f"Epoch {epoch}: loss={avg_loss:.4f}")
            if epoch % ckpt_interval == 0:
                self._save_checkpoint(epoch=epoch, loss=avg_loss)
        self._save_checkpoint(epoch=epoch, loss=avg_loss)
        print("Training complete.")
```

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: spot-gpu-trainer
  namespace: ml-workloads
spec:
  completions: 1
  backoffLimit: 20
  template:
    spec:
      terminationGracePeriodSeconds: 60
      tolerations:
      - key: cloud.google.com/gke-spot
        operator: Exists
        effect: NoSchedule
      - key: nvidia.com/gpu
        operator: Exists
        effect: NoSchedule
      containers:
      - name: trainer
        image: us-central1-docker.pkg.dev/my-gcp-project/ml-images/spot-trainer:latest
        command: ["python3", "/app/spot_gpu_trainer.py"]
        env:
        - name: JOB_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        resources:
          requests:
            nvidia.com/gpu: "1"
            cpu: "4"
            memory: 16Gi
          limits:
            nvidia.com/gpu: "1"
      restartPolicy: OnFailure
      serviceAccountName: trainer-ksa
```

---

### 50. Production ML Platform: GPU Node Pools + Vertex AI + KCC + Monitoring + Cost Controls
Deploy a complete production ML platform combining GPU node pools, Vertex AI integration, KCC infrastructure management, Cloud Monitoring, and cost guardrails.

```yaml
# ============================================================
# Production ML Platform Stack
# Apply with: kubectl apply -k ml-platform/
# ============================================================

# 1. GPU node pools (T4 for inference, A100 for training)
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: t4-inference-pool
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  autoscaling:
    minNodeCount: 1
    maxNodeCount: 16
  nodeConfig:
    machineType: n1-standard-8
    guestAccelerators:
    - type: nvidia-tesla-t4
      count: 1
    taints:
    - key: nvidia.com/gpu
      value: present
      effect: NO_SCHEDULE
    labels:
      workload-type: inference
      gpu-type: t4
---
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerNodePool
metadata:
  name: a100-training-pool
  namespace: config-connector
spec:
  location: us-central1
  clusterRef:
    name: my-cluster
  autoscaling:
    minNodeCount: 0
    maxNodeCount: 8
  nodeConfig:
    spot: true
    machineType: a2-highgpu-1g
    guestAccelerators:
    - type: nvidia-tesla-a100
      count: 1
    taints:
    - key: nvidia.com/gpu
      value: present
      effect: NO_SCHEDULE
    - key: cloud.google.com/gke-spot
      value: "true"
      effect: NO_SCHEDULE
    labels:
      workload-type: training
      gpu-type: a100
---
# 2. GPU quota per team
apiVersion: v1
kind: ResourceQuota
metadata:
  name: ml-platform-quota
  namespace: ml-workloads
spec:
  hard:
    requests.nvidia.com/gpu: "16"
    limits.nvidia.com/gpu: "16"
    requests.cpu: "128"
    requests.memory: 512Gi
---
# 3. GPU utilization alert
apiVersion: monitoring.cnrm.cloud.google.com/v1beta1
kind: MonitoringAlertPolicy
metadata:
  name: gpu-utilization-alert
  namespace: config-connector
spec:
  displayName: "Production GPU Low Utilization"
  conditions:
  - displayName: "GPU duty_cycle below 15%"
    conditionThreshold:
      filter: |
        resource.type="k8s_node"
        AND metric.type="kubernetes.io/node/accelerator/duty_cycle"
        AND resource.label.cluster_name="my-cluster"
      aggregations:
      - alignmentPeriod: "600s"
        crossSeriesReducer: REDUCE_MEAN
        perSeriesAligner: ALIGN_MEAN
      comparison: COMPARISON_LT
      thresholdValue: 0.15
      duration: "3600s"
  combiner: OR
  severity: WARNING
---
# 4. Cost budget for ML platform
apiVersion: billingbudgets.cnrm.cloud.google.com/v1beta1
kind: BillingBudgetsBudget
metadata:
  name: ml-platform-budget
  namespace: config-connector
spec:
  billingAccountRef:
    external: "billingAccounts/BILLING_ACCOUNT_ID"
  displayName: "ML Platform Monthly Budget"
  amount:
    specifiedAmount:
      currencyCode: "USD"
      units: "10000"
  thresholdRules:
  - thresholdPercent: 0.6
  - thresholdPercent: 0.8
  - thresholdPercent: 1.0
  allUpdatesRule:
    pubsubTopicRef:
      name: ml-training-notifications
---
# 5. Artifact Registry for ML images
apiVersion: artifactregistry.cnrm.cloud.google.com/v1beta1
kind: ArtifactRegistryRepository
metadata:
  name: production-ml-images
  namespace: config-connector
spec:
  location: us-central1
  format: DOCKER
  description: "Production ML serving and training images"
```

```bash
# Validate the full ML platform stack
echo "=== GPU Node Pool Status ==="
kubectl get containernodepools -n config-connector \
  -o custom-columns="NAME:.metadata.name,READY:.status.conditions[0].reason"

echo "=== GPU Availability ==="
kubectl get nodes -l cloud.google.com/gke-accelerator \
  -o custom-columns="NODE:.metadata.name,GPU:.status.allocatable.nvidia\.com/gpu,TYPE:.metadata.labels.gpu-type"

echo "=== Quota Usage ==="
kubectl get resourcequota -n ml-workloads \
  -o custom-columns="NAME:.metadata.name,GPU-USED:.status.used.requests\.nvidia\.com/gpu,GPU-HARD:.status.hard.requests\.nvidia\.com/gpu"

echo "=== Triton Serving Health ==="
kubectl get pods -n ml-workloads -l app=triton-prod \
  -o custom-columns="POD:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName"

echo "=== Budget Status ==="
gcloud billing budgets list \
  --billing-account=BILLING_ACCOUNT_ID \
  --format="table(displayName,amount.specifiedAmount.units,thresholdRules[0].thresholdPercent)"
```
