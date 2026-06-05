# GPU and ML Workloads on EKS — Examples

## Basic

### 1. Create GPU node group
```yaml
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
metadata:
  name: ml-cluster
  region: ap-south-1

managedNodeGroups:
  - name: gpu-workers
    instanceType: p3.2xlarge    # 1 NVIDIA V100 GPU
    desiredCapacity: 2
    minSize: 0
    maxSize: 10
    amiFamily: AmazonLinux2023
    labels:
      workload: ml
      accelerator: nvidia-gpu
    taints:
      - key: nvidia.com/gpu
        value: "true"
        effect: NoSchedule
```

---

### 2. Install NVIDIA device plugin
```bash
# Install NVIDIA device plugin (exposes GPUs to K8s)
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.0/nvidia-device-plugin.yml

# Verify GPUs are allocatable
kubectl get nodes -l accelerator=nvidia-gpu -o json | \
  jq '.items[].status.allocatable | {"gpu": ."nvidia.com/gpu"}'

# Expected: "gpu": "1" (for p3.2xlarge)
```

---

### 3. Request GPU in a pod
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gpu-test
spec:
  restartPolicy: Never
  tolerations:
    - key: nvidia.com/gpu
      operator: Exists
      effect: NoSchedule
  containers:
    - name: cuda-test
      image: nvidia/cuda:11.8.0-base-ubuntu20.04
      command: ["nvidia-smi"]
      resources:
        limits:
          nvidia.com/gpu: 1    # request 1 GPU
        requests:
          nvidia.com/gpu: 1
```
```bash
kubectl apply -f gpu-pod.yaml
kubectl logs gpu-test   # shows nvidia-smi output
```

---

### 4. Check GPU availability
```bash
# Check GPU allocatable per node
kubectl get nodes -o custom-columns=\
"NAME:.metadata.name,GPU:.status.allocatable.nvidia\.com/gpu"

# Check GPU utilization (DCGM exporter)
kubectl exec -it gpu-test -- nvidia-smi

# GPU memory usage
kubectl exec -it gpu-test -- \
  nvidia-smi --query-gpu=name,memory.used,memory.free,utilization.gpu \
  --format=csv
```

---

### 5. PyTorch training job on GPU
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pytorch-training
spec:
  restartPolicy: Never
  tolerations:
    - key: nvidia.com/gpu
      operator: Exists
      effect: NoSchedule
  nodeSelector:
    accelerator: nvidia-gpu
  containers:
    - name: trainer
      image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
      resources:
        limits:
          nvidia.com/gpu: 1
          memory: 16Gi
        requests:
          nvidia.com/gpu: 1
          memory: 8Gi
          cpu: 4
      command:
        - python
        - -c
        - |
          import torch
          print(f"CUDA available: {torch.cuda.is_available()}")
          print(f"GPU: {torch.cuda.get_device_name(0)}")
          x = torch.randn(1000, 1000).cuda()
          print(f"Tensor on GPU: {x.device}")
      volumeMounts:
        - name: training-data
          mountPath: /data
        - name: model-output
          mountPath: /output
  volumes:
    - name: training-data
      persistentVolumeClaim:
        claimName: training-data-pvc
    - name: model-output
      persistentVolumeClaim:
        claimName: model-output-pvc
```

---

### 6. TensorFlow inference serving
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tf-serving
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tf-serving
  template:
    metadata:
      labels:
        app: tf-serving
    spec:
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
      containers:
        - name: serving
          image: tensorflow/serving:2.13.0-gpu
          ports:
            - containerPort: 8500   # gRPC
            - containerPort: 8501   # REST
          resources:
            limits:
              nvidia.com/gpu: 1
          env:
            - name: MODEL_NAME
              value: my-model
          volumeMounts:
            - name: models
              mountPath: /models
      volumes:
        - name: models
          persistentVolumeClaim:
            claimName: model-store-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: tf-serving
spec:
  selector:
    app: tf-serving
  ports:
    - name: grpc
      port: 8500
    - name: rest
      port: 8501
```

---

### 7. AWS Inferentia2 (cost-optimized inference)
```yaml
# Inferentia2: AWS custom chip, ~70% cheaper than GPU for inference
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
managedNodeGroups:
  - name: inferentia-workers
    instanceType: inf2.xlarge   # 1 Inferentia2 chip
    desiredCapacity: 1
    labels:
      workload: inference
      accelerator: aws-inferentia
    taints:
      - key: aws.amazon.com/neuron
        value: "true"
        effect: NoSchedule
```
```yaml
# Neuron device plugin (required for Inferentia)
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: neuron-device-plugin
  namespace: kube-system
spec:
  selector:
    matchLabels:
      name: neuron-device-plugin
  template:
    spec:
      tolerations:
        - key: aws.amazon.com/neuron
          operator: Exists
          effect: NoSchedule
      containers:
        - name: neuron-device-plugin
          image: public.ecr.aws/neuron/neuron-device-plugin:2.x
          resources:
            limits:
              aws.amazon.com/neuron: 1
```

---

### 8. GPU time-slicing (share one GPU across multiple pods)
```yaml
# NVIDIA device plugin config for time-slicing
apiVersion: v1
kind: ConfigMap
metadata:
  name: time-slicing-config
  namespace: kube-system
data:
  any: |-
    version: v1
    flags:
      migStrategy: none
    sharing:
      timeSlicing:
        resources:
          - name: nvidia.com/gpu
            replicas: 4    # 4 pods share 1 GPU
---
# Update device plugin deployment to use config
kubectl patch daemonset nvidia-device-plugin-daemonset -n kube-system \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/env/-","value":{"name":"CONFIG_FILE","value":"/etc/kubernetes/nvidia/config.yaml"}}]'
```

---

### 9. Multi-GPU pod (single node, multiple GPUs)
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: multi-gpu-training
spec:
  tolerations:
    - key: nvidia.com/gpu
      operator: Exists
      effect: NoSchedule
  containers:
    - name: trainer
      image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
      resources:
        limits:
          nvidia.com/gpu: 4    # request 4 GPUs (e.g., p3.8xlarge has 4 V100s)
      command:
        - python
        - -m
        - torch.distributed.launch
        - --nproc_per_node=4   # 1 process per GPU
        - train.py
```

---

### 10. Check DCGM (GPU metrics) exporter
```bash
# Install DCGM Exporter for GPU metrics in Prometheus
helm repo add gpu-helm-charts https://nvidia.github.io/dcgm-exporter/helm-charts
helm install dcgm-exporter gpu-helm-charts/dcgm-exporter \
  --namespace monitoring \
  --create-namespace

# GPU metrics now available:
# DCGM_FI_DEV_GPU_UTIL       — GPU utilization %
# DCGM_FI_DEV_MEM_COPY_UTIL — Memory bandwidth utilization
# DCGM_FI_DEV_FB_FREE        — Free GPU memory (MB)
# DCGM_FI_DEV_FB_USED        — Used GPU memory (MB)
# DCGM_FI_DEV_SM_CLOCK       — SM clock frequency
# DCGM_FI_DEV_POWER_USAGE    — Power consumption (watts)

# Query GPU utilization
kubectl port-forward -n monitoring svc/dcgm-exporter 9400
curl localhost:9400/metrics | grep DCGM_FI_DEV_GPU_UTIL
```

---

### 11. S3 for ML datasets
```yaml
# Use Mountpoint for S3 to access training data directly
apiVersion: v1
kind: PersistentVolume
metadata:
  name: training-data-pv
spec:
  capacity:
    storage: 10Ti    # S3 is effectively unlimited
  accessModes:
    - ReadWriteMany
  mountOptions:
    - region ap-south-1
  csi:
    driver: s3.csi.aws.com
    volumeHandle: my-ml-training-bucket
    volumeAttributes:
      bucketName: ml-training-data
```

---

### 12. Spot instances for training jobs (save 70-90%)
```yaml
# Training job on spot instances
apiVersion: batch/v1
kind: Job
metadata:
  name: model-training
spec:
  template:
    spec:
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
        - key: spot
          operator: Exists
          effect: NoSchedule
      nodeSelector:
        karpenter.sh/capacity-type: spot
        accelerator: nvidia-gpu
      restartPolicy: OnFailure   # restart if spot interrupted
      containers:
        - name: trainer
          image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
          resources:
            limits:
              nvidia.com/gpu: 1
          command: ["python", "train.py", "--checkpoint-interval=100"]
          # Save checkpoints frequently so spot interruption doesn't lose progress
          volumeMounts:
            - name: checkpoints
              mountPath: /checkpoints
      volumes:
        - name: checkpoints
          persistentVolumeClaim:
            claimName: checkpoint-pvc   # EFS for durability across spot interruptions
```

---

### 13. MIG (Multi-Instance GPU) configuration
```bash
# MIG: partition one A100 GPU into multiple isolated GPU instances
# Available on A100/H100 GPUs (p4d/p4de instances)

# Configure MIG mode
kubectl exec -it gpu-node -- nvidia-smi -mig 1

# Create GPU instances (e.g., 3x MIG 3g.20gb on A100 80GB)
kubectl exec -it gpu-node -- nvidia-smi mig -cgi 3g.20gb,3g.20gb,2g.10gb -C

# Update device plugin config for MIG
# Each MIG instance appears as separate GPU to K8s
```

---

### 14. Node selector for GPU workloads
```yaml
# Strict GPU node placement
spec:
  nodeSelector:
    accelerator: nvidia-gpu
    node.kubernetes.io/instance-type: p3.2xlarge
  tolerations:
    - key: nvidia.com/gpu
      operator: Exists
      effect: NoSchedule
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
          - matchExpressions:
              - key: nvidia.com/gpu.memory
                operator: Gt
                values: ["16000"]   # require at least 16GB GPU memory
```

---

### 15. Monitor GPU utilization
```bash
# Live GPU monitoring via kubectl exec
kubectl exec -it $(kubectl get pod -l app=trainer -o name | head -1) -- \
  watch -n 1 nvidia-smi

# GPU metrics via Prometheus query
curl "localhost:9090/api/v1/query?query=DCGM_FI_DEV_GPU_UTIL" | \
  jq '.data.result[] | {gpu: .metric.gpu, util: .value[1]}'
```

---

## Intermediate

### 16. Kubeflow for ML pipelines
```bash
# Install Kubeflow on EKS
kustomize build github.com/kubeflow/manifests/example | kubectl apply -f -

# Wait for all pods to be ready
kubectl wait --for=condition=Ready pods --all -n kubeflow --timeout=600s

# Access Kubeflow UI
kubectl port-forward svc/istio-ingressgateway -n istio-system 8080:80
```
```yaml
# Kubeflow Pipeline definition
apiVersion: kubeflow.org/v1alpha1
kind: Pipeline
metadata:
  name: training-pipeline
spec:
  templates:
    - name: preprocess
      container:
        image: preprocess:latest
        command: ["python", "preprocess.py"]
        args: ["--input", "s3://my-data/raw/", "--output", "s3://my-data/processed/"]
    - name: train
      container:
        image: trainer:latest
        resources:
          limits:
            nvidia.com/gpu: 1
    - name: evaluate
      container:
        image: evaluator:latest
```

---

### 17. Distributed training with PyTorchJob (Kubeflow)
```yaml
apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: distributed-training
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      restartPolicy: OnFailure
      template:
        spec:
          tolerations:
            - key: nvidia.com/gpu
              operator: Exists
              effect: NoSchedule
          containers:
            - name: pytorch
              image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
              resources:
                limits:
                  nvidia.com/gpu: 1
              command: ["python", "train_distributed.py"]
    Worker:
      replicas: 3   # 4 total GPUs (1 master + 3 workers)
      restartPolicy: OnFailure
      template:
        spec:
          tolerations:
            - key: nvidia.com/gpu
              operator: Exists
              effect: NoSchedule
          containers:
            - name: pytorch
              image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
              resources:
                limits:
                  nvidia.com/gpu: 1
              command: ["python", "train_distributed.py"]
```

---

### 18. Argo Workflows for ML pipelines
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  name: ml-pipeline
spec:
  entrypoint: ml-pipeline
  templates:
    - name: ml-pipeline
      dag:
        tasks:
          - name: preprocess
            template: preprocess-step
          - name: train
            template: train-step
            dependencies: [preprocess]
          - name: evaluate
            template: evaluate-step
            dependencies: [train]
          - name: deploy
            template: deploy-step
            dependencies: [evaluate]

    - name: preprocess-step
      container:
        image: preprocess:latest
        command: ["python", "preprocess.py"]
        resources:
          requests:
            cpu: 4
            memory: 8Gi

    - name: train-step
      container:
        image: trainer:latest
        command: ["python", "train.py"]
        resources:
          limits:
            nvidia.com/gpu: 1
        tolerations:
          - key: nvidia.com/gpu
            operator: Exists
            effect: NoSchedule

    - name: evaluate-step
      container:
        image: evaluator:latest
        command: ["python", "evaluate.py"]
        resources:
          requests:
            cpu: 2
            memory: 4Gi

    - name: deploy-step
      container:
        image: bitnami/kubectl:latest
        command: ["kubectl", "apply", "-f", "/models/deployment.yaml"]
```

---

### 19. Model serving with Triton Inference Server
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: triton-server
spec:
  replicas: 2
  template:
    spec:
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
      containers:
        - name: triton
          image: nvcr.io/nvidia/tritonserver:23.10-py3
          args:
            - tritonserver
            - --model-repository=s3://my-model-bucket/models
            - --backend-config=python,shm-default-byte-size=16777216
          ports:
            - containerPort: 8000   # HTTP
            - containerPort: 8001   # gRPC
            - containerPort: 8002   # Metrics
          resources:
            limits:
              nvidia.com/gpu: 1
          readinessProbe:
            httpGet:
              path: /v2/health/ready
              port: 8000
            initialDelaySeconds: 30
```

---

### 20. GPU autoscaling with KEDA + custom metrics
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: inference-scaler
spec:
  scaleTargetRef:
    name: triton-server
  minReplicaCount: 1
  maxReplicaCount: 10
  triggers:
    - type: prometheus
      metadata:
        serverAddress: http://prometheus.monitoring.svc.cluster.local:9090
        metricName: gpu_inference_queue_depth
        query: |
          nv_inference_queue_duration_us{model="my-model"} /
          nv_inference_count{model="my-model"}
        threshold: "1000"   # scale when queue depth > 1000μs average
```

---

## Nested

### 21. Complete ML platform on EKS
```bash
#!/bin/bash
echo "Setting up ML platform on EKS..."

# 1. GPU node group
eksctl create nodegroup \
  --cluster ml-cluster \
  --name gpu-workers \
  --node-type p3.2xlarge \
  --nodes 0 \
  --nodes-min 0 \
  --nodes-max 10 \
  --node-labels workload=ml,accelerator=nvidia-gpu

# 2. NVIDIA device plugin
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.14.0/nvidia-device-plugin.yml

# 3. DCGM Exporter (GPU metrics)
helm install dcgm-exporter gpu-helm-charts/dcgm-exporter -n monitoring

# 4. Node Termination Handler (for spot interruption)
helm upgrade --install aws-node-termination-handler \
  eks/aws-node-termination-handler -n kube-system

# 5. Karpenter (efficient GPU node provisioning)
helm upgrade --install karpenter karpenter/karpenter \
  --namespace karpenter --create-namespace \
  --set settings.clusterName=ml-cluster

# 6. Argo Workflows (pipeline orchestration)
kubectl create namespace argo
kubectl apply -n argo \
  -f https://github.com/argoproj/argo-workflows/releases/download/v3.5.0/install.yaml

echo "ML platform ready!"
```

---

### 22. Model registry with MLflow on EKS
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mlflow
  namespace: mlops
spec:
  replicas: 1
  template:
    spec:
      serviceAccountName: mlflow-sa   # IRSA for S3 and RDS access
      containers:
        - name: mlflow
          image: python:3.11
          command:
            - sh
            - -c
            - |
              pip install mlflow psycopg2-binary boto3
              mlflow server \
                --backend-store-uri postgresql://admin:$DB_PASS@$DB_HOST:5432/mlflow \
                --default-artifact-root s3://ml-artifacts/mlflow \
                --host 0.0.0.0 \
                --port 5000
          env:
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: db-config
                  key: host
            - name: DB_PASS
              valueFrom:
                secretKeyRef:
                  name: db-secret
                  key: password
          ports:
            - containerPort: 5000
```

---

## Advanced

### 23. NVIDIA Multi-Process Service (MPS) for inference
```yaml
# MPS allows concurrent GPU sharing without time-slicing overhead
# Better for inference (lower latency vs time-slicing)
apiVersion: v1
kind: ConfigMap
metadata:
  name: nvidia-mps-config
data:
  config: |
    version: v1
    sharing:
      mps:
        resources:
          - name: nvidia.com/gpu
            replicas: 10   # 10 processes share 1 GPU via MPS
```

---

### 24. Distributed training with EFA (Elastic Fabric Adapter)
```yaml
# EFA: high-bandwidth, low-latency networking for distributed ML
# Required for p4d.24xlarge (8 GPUs) multi-node training
apiVersion: eksctl.io/v1alpha5
kind: ClusterConfig
managedNodeGroups:
  - name: efa-gpu-workers
    instanceType: p4d.24xlarge
    desiredCapacity: 2
    efaEnabled: true    # enables EFA network interfaces
    labels:
      workload: distributed-training
      accelerator: nvidia-gpu-a100
```
```yaml
# PyTorchJob with EFA for NCCL communication
apiVersion: kubeflow.org/v1
kind: PyTorchJob
spec:
  pytorchReplicaSpecs:
    Worker:
      replicas: 2   # 2 nodes x 8 GPUs = 16 GPUs total
      template:
        spec:
          containers:
            - name: pytorch
              image: pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
              resources:
                limits:
                  nvidia.com/gpu: 8
                  vpc.amazonaws.com/efa: 4   # EFA interfaces for NCCL
              env:
                - name: NCCL_DEBUG
                  value: INFO
                - name: FI_EFA_USE_DEVICE_RDMA
                  value: "1"
```

---

### 25. GPU utilization alerting
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gpu-alerts
  namespace: monitoring
spec:
  groups:
    - name: gpu.alerts
      rules:
        # Alert when GPU memory > 90%
        - alert: GPUMemoryHigh
          expr: |
            DCGM_FI_DEV_FB_USED / (DCGM_FI_DEV_FB_USED + DCGM_FI_DEV_FB_FREE) > 0.90
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "GPU memory usage high (>90%)"

        # Alert when GPU underutilized (waste)
        - alert: GPUUnderutilized
          expr: |
            DCGM_FI_DEV_GPU_UTIL < 20
          for: 30m
          labels:
            severity: info
          annotations:
            summary: "GPU utilization low (<20%) for 30 minutes"
            description: "Consider scaling down GPU nodes to save costs"

        # Alert when GPU error occurred
        - alert: GPUXidError
          expr: |
            DCGM_FI_DEV_XID_ERRORS > 0
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "GPU XID error detected — possible hardware failure"
```

---
