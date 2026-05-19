# Networking with KCC — Examples

## Basic

### 1. Create a VPC Network via KCC
Declare a custom VPC network as a Kubernetes resource.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: app-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  autoCreateSubnetworks: false
  description: "Application VPC network"
  routingConfig:
    routingMode: REGIONAL
```

---

### 2. Create a Subnet via KCC
Declare a subnet within a VPC.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: gke-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.1.0.0/16
  networkRef:
    name: app-vpc
  description: "GKE primary subnet"
```

---

### 3. Create a Subnet with Secondary Ranges (GKE Alias IPs)
Add secondary IP ranges for GKE Pods and Services.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: gke-alias-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.0.0.0/16
  networkRef:
    name: app-vpc
  secondaryIpRange:
    - rangeName: pods
      ipCidrRange: 10.2.0.0/16
    - rangeName: services
      ipCidrRange: 10.3.0.0/20
```

---

### 4. Create a Firewall Rule — Allow HTTP/HTTPS
Allow inbound web traffic to tagged instances.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-web-traffic
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: app-vpc
  direction: INGRESS
  allowed:
    - ipProtocol: tcp
      ports:
        - "80"
        - "443"
  sourceRanges:
    - 0.0.0.0/0
  targetTags:
    - web-server
```

---

### 5. Create a Firewall Rule — Allow Internal Traffic
Allow all internal VPC traffic between instances.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-internal
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: app-vpc
  direction: INGRESS
  allowed:
    - ipProtocol: tcp
    - ipProtocol: udp
    - ipProtocol: icmp
  sourceRanges:
    - 10.0.0.0/8
```

---

### 6. Create a Static External IP via KCC
Reserve a static external IP address.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: web-external-ip
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  addressType: EXTERNAL
  description: "External IP for web LoadBalancer"
```

---

### 7. Create an Internal IP Address
Reserve an internal IP within a subnet.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: db-internal-ip
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  addressType: INTERNAL
  subnetworkRef:
    name: gke-subnet
  address: 10.1.0.100
```

---

### 8. Create a Cloud Router via KCC
Deploy a Cloud Router for dynamic routing (required for Cloud NAT).

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouter
metadata:
  name: app-router
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: app-vpc
  description: "Cloud Router for NAT"
```

---

### 9. Create a Cloud NAT via KCC
Enable outbound internet access for private GKE nodes.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouterNAT
metadata:
  name: app-nat
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  routerRef:
    name: app-router
  natIpAllocateOption: AUTO_ONLY
  sourceSubnetworkIpRangesToNat: ALL_SUBNETWORKS_ALL_IP_RANGES
  logConfig:
    enable: true
    filter: ERRORS_ONLY
```

---

### 10. List Network KCC Resources
View all KCC-managed networking resources.

```bash
kubectl get computenetworks -A
kubectl get computesubnetworks -A
kubectl get computefirewalls -A
kubectl get computeaddresses -A
kubectl get computerouters -A
kubectl get computerouternats -A
```

---

### 11. Create a VPC Peering via KCC
Peer two VPC networks for direct connectivity.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetworkPeering
metadata:
  name: vpc-peering-to-shared
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: app-vpc
  peerNetworkRef:
    external: projects/shared-services-project/global/networks/shared-vpc
  exportCustomRoutes: false
  importCustomRoutes: false
```

---

### 12. Create a Cloud DNS Zone via KCC
Declare a private DNS zone for internal service discovery.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSManagedZone
metadata:
  name: internal-zone
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  dnsName: "internal.example.com."
  visibility: private
  privateVisibilityConfig:
    networks:
      - networkRef:
          name: app-vpc
  description: "Internal DNS zone"
```

---

### 13. Add DNS Records via KCC
Create A, CNAME, or other DNS records in a managed zone.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSRecordSet
metadata:
  name: api-record
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  managedZoneRef:
    name: internal-zone
  name: "api.internal.example.com."
  type: A
  ttl: 300
  rrdatas:
    - "10.1.0.100"
```

---

### 14. Create a Firewall Rule — Deny Egress
Block outbound traffic to specific external IPs.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: deny-restricted-egress
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: app-vpc
  direction: EGRESS
  denied:
    - ipProtocol: tcp
      ports:
        - "25"   # block outbound SMTP
  destinationRanges:
    - 0.0.0.0/0
  priority: 1000
```

---

### 15. Enable Private Google Access on Subnet
Allow VM instances without external IPs to access Google APIs.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: private-access-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.10.0.0/24
  networkRef:
    name: app-vpc
  privateIpGoogleAccess: true   # allows access to Google APIs without external IP
```

---

## Intermediate

### 16. VPC Flow Logs via KCC
Enable VPC flow logs on a subnet for network observability.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: logged-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.20.0.0/24
  networkRef:
    name: app-vpc
  logConfig:
    aggregationInterval: INTERVAL_5_SEC
    flowSampling: 0.5
    metadata: INCLUDE_ALL_METADATA
    enable: true
```

---

### 17. Shared VPC Host Project Configuration
Configure a project as a Shared VPC host project.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSharedVPCHostProject
metadata:
  name: host-project-shared-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: host-project
spec:
  resourceID: host-project
```

---

### 18. Shared VPC Service Project Attachment
Attach a service project to a Shared VPC host project.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSharedVPCServiceProject
metadata:
  name: attach-service-project
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: host-project
spec:
  serviceProjectRef:
    external: service-project-id
```

---

### 19. Cloud Interconnect Attachment via KCC
Attach a Dedicated Interconnect to the VPC.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeInterconnectAttachment
metadata:
  name: on-prem-attachment
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  routerRef:
    name: app-router
  type: PARTNER
  description: "On-premises connectivity"
```

---

### 20. Cloud VPN via KCC
Establish a VPN tunnel for on-premises connectivity.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeVPNGateway
metadata:
  name: app-vpn-gateway
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: app-vpc
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeVPNTunnel
metadata:
  name: vpn-to-onprem
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  vpnGatewayRef:
    name: app-vpn-gateway
  peerIp: "203.0.113.1"
  sharedSecret: "my-vpn-shared-secret"
  ikeVersion: 2
```

---

### 21. Network Endpoint Group (NEG) via KCC
Declare a NEG for container-native load balancing.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetworkEndpointGroup
metadata:
  name: gke-neg
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1-a
  networkRef:
    name: app-vpc
  subnetworkRef:
    name: gke-subnet
  networkEndpointType: GCE_VM_IP_PORT
  description: "NEG for GKE container-native LB"
```

---

### 22. Cloud Load Balancing Backend Service via KCC
Create a backend service for HTTP(S) LB.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeBackendService
metadata:
  name: web-backend-service
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  protocol: HTTP
  healthChecks:
    - healthCheckRef:
        name: web-health-check
  backends:
    - balancingMode: RATE
      maxRatePerEndpoint: 100
      groupRef:
        external: "https://www.googleapis.com/compute/v1/projects/my-gcp-project/zones/us-central1-a/networkEndpointGroups/gke-neg"
  loadBalancingScheme: EXTERNAL_MANAGED
  enableCDN: true
```

---

### 23. Health Check via KCC
Create an HTTP health check for load balancers.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeHealthCheck
metadata:
  name: web-health-check
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  httpHealthCheck:
    port: 8080
    requestPath: /healthz
  checkIntervalSec: 10
  timeoutSec: 5
  healthyThreshold: 2
  unhealthyThreshold: 3
```

---

### 24. SSL Policy via KCC
Configure TLS/SSL security policy for HTTPS load balancers.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSSLPolicy
metadata:
  name: modern-ssl-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  profile: MODERN
  minTlsVersion: TLS_1_2
  description: "Modern TLS 1.2+ policy"
```

---

### 25. Private Service Connect via KCC
Use Private Service Connect to access Google APIs without external IPs.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: psc-endpoint-address
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  addressType: INTERNAL
  subnetworkRef:
    name: gke-subnet
  purpose: PRIVATE_SERVICE_CONNECT
  address: 10.1.0.200
```

---

### 26. Cloud Armor Security Policy via KCC
Create a WAF policy for load balancer protection.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSecurityPolicy
metadata:
  name: waf-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  description: "WAF policy for GKE workloads"
  rule:
    - action: allow
      priority: 1000
      match:
        versionedExpr: SRC_IPS_V1
        config:
          srcIpRanges:
            - 10.0.0.0/8
    - action: deny-403
      priority: 2147483647
      match:
        versionedExpr: SRC_IPS_V1
        config:
          srcIpRanges:
            - "*"
      description: "Default deny"
```

---

### 27. Enable Private Google Access — Restricted VIP
Configure restricted.googleapis.com for VPC Service Controls.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: vsc-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.30.0.0/24
  networkRef:
    name: app-vpc
  privateIpGoogleAccess: true
  privateIpv6GoogleAccess: DISABLE_GOOGLE_ACCESS
```

---

### 28. Cloud DNS Public Zone
Create a public DNS zone for external domain resolution.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSManagedZone
metadata:
  name: public-zone
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  dnsName: "example.com."
  visibility: public
  description: "Public DNS zone"
  dnssecConfig:
    state: on
```

---

### 29. DNS Policy — Override DNS for GKE Cluster
Apply custom DNS resolution within the GKE cluster.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSPolicy
metadata:
  name: gke-dns-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    - networkRef:
        name: app-vpc
  enableLogging: true
  alternativeNameServerConfig:
    targetNameServers:
      - ipv4Address: 8.8.8.8
        forwardingPath: default
```

---

### 30. Verify Network Resource Connectivity
Test connectivity between GKE nodes and services.

```bash
# Test connectivity from a debug pod
kubectl run nettest --image=nicolaka/netshoot --rm -it --restart=Never -- bash

# Inside the pod:
curl -v http://web-service.default.svc.cluster.local
nslookup web-service.default.svc.cluster.local
traceroute 8.8.8.8
ping 10.1.0.100
```

---

## Nested

### 31. Full VPC Architecture via KCC
Create a complete multi-subnet VPC for a GKE deployment.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: production-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  autoCreateSubnetworks: false
  routingConfig:
    routingMode: REGIONAL
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: gke-nodes-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.0.0.0/16
  networkRef:
    name: production-vpc
  privateIpGoogleAccess: true
  secondaryIpRange:
    - rangeName: gke-pods
      ipCidrRange: 10.1.0.0/16
    - rangeName: gke-services
      ipCidrRange: 10.2.0.0/20
  logConfig:
    enable: true
    aggregationInterval: INTERVAL_5_SEC
    flowSampling: 0.5
    metadata: INCLUDE_ALL_METADATA
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: mgmt-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.3.0.0/24
  networkRef:
    name: production-vpc
  privateIpGoogleAccess: true
```

---

### 32. NAT with Static IPs for GKE Egress
Configure Cloud NAT with static IPs for predictable outbound IPs.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: nat-ip-1
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  addressType: EXTERNAL
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: nat-ip-2
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  addressType: EXTERNAL
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouterNAT
metadata:
  name: static-nat
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  routerRef:
    name: app-router
  natIpAllocateOption: MANUAL_ONLY
  natIps:
    - name: nat-ip-1
    - name: nat-ip-2
  sourceSubnetworkIpRangesToNat: ALL_SUBNETWORKS_ALL_IP_RANGES
```

---

### 33. Kubernetes NetworkPolicy — Restrict Pod Communication
Apply fine-grained network policies within the GKE cluster.

```yaml
# Allow frontend to talk to backend only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-allow-from-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
  policyTypes:
    - Ingress
---
# Default deny all ingress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: production
spec:
  podSelector: {}
  policyTypes:
    - Ingress
```

---

### 34. KCC — Firewall with Network Tags for GKE Workloads
Use network tags to control traffic to specific GKE node pools.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-gke-gpu-nodepool
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: app-vpc
  direction: INGRESS
  allowed:
    - ipProtocol: tcp
      ports:
        - "22"     # SSH for debugging
  sourceRanges:
    - 35.235.240.0/20   # IAP tunnel range
  targetTags:
    - gke-gpu-pool
```

---

### 35. DNS Peering Between VPCs
Enable cross-VPC DNS resolution via DNS peering.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSManagedZone
metadata:
  name: peer-zone
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: consumer-project
spec:
  dnsName: "internal.shared.example.com."
  visibility: private
  peeringConfig:
    targetNetwork:
      networkRef:
        external: "https://www.googleapis.com/compute/v1/projects/producer-project/global/networks/shared-vpc"
  privateVisibilityConfig:
    networks:
      - networkRef:
          name: consumer-vpc
```

---

### 36. GKE with VPC-Native Networking (Alias IPs)
Configure a GKE cluster to use VPC-native networking.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: vpc-native-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  networkRef:
    name: production-vpc
  subnetworkRef:
    name: gke-nodes-subnet
  ipAllocationPolicy:
    useIpAliases: true
    clusterSecondaryRangeName: gke-pods
    servicesSecondaryRangeName: gke-services
  networkPolicy:
    enabled: true
    provider: CALICO
  datapathProvider: ADVANCED_DATAPATH
  initialNodeCount: 2
```

---

### 37. Hierarchical Firewall Policies via KCC
Apply org-level firewall rules that override project rules.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewallPolicy
metadata:
  name: org-firewall-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  shortName: org-baseline-rules
  description: "Organization-wide baseline firewall rules"
  parent: organizations/123456789
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewallPolicyRule
metadata:
  name: block-rdp
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  firewallPolicyRef:
    name: org-firewall-policy
  priority: 1000
  action: deny
  direction: INGRESS
  match:
    layer4Configs:
      - ipProtocol: tcp
        ports:
          - "3389"   # RDP
    srcIpRanges:
      - 0.0.0.0/0
  description: "Block RDP from internet"
```

---

### 38. Private Service Access for Cloud SQL
Set up private service access so GKE can connect to Cloud SQL privately.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: psa-range
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  addressType: INTERNAL
  purpose: VPC_PEERING
  prefixLength: 16
  networkRef:
    name: production-vpc
  description: "IP range for private service access"
---
apiVersion: servicenetworking.cnrm.cloud.google.com/v1beta1
kind: ServiceNetworkingConnection
metadata:
  name: psa-connection
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: production-vpc
  service: servicenetworking.googleapis.com
  reservedPeeringRanges:
    - name: psa-range
```

---

### 39. Multi-Region DNS Routing Policy
Use Cloud DNS routing policies for geographic load balancing.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSRecordSet
metadata:
  name: geo-routing
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  managedZoneRef:
    name: public-zone
  name: "api.example.com."
  type: A
  routingPolicy:
    geo:
      items:
        - location: us-central1
          rrdatas:
            - "34.56.78.90"
        - location: europe-west1
          rrdatas:
            - "34.56.78.91"
```

---

### 40. Network Monitoring — Connectivity Tests
Set up GCP Network Intelligence Center connectivity tests.

```bash
# Create a connectivity test
gcloud network-management connectivity-tests create gke-to-sql \
  --source-instance projects/my-project/zones/us-central1-a/instances/gke-node-1 \
  --destination-ip-address 10.1.0.100 \
  --destination-port 5432 \
  --protocol TCP \
  --project my-gcp-project

# Check test results
gcloud network-management connectivity-tests describe gke-to-sql \
  --project my-gcp-project
```

---

## Advanced

### 41. Multi-VPC Hub-and-Spoke Architecture
Connect multiple spoke VPCs to a central hub VPC.

```yaml
# Hub VPC
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: hub-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: hub-project
spec:
  autoCreateSubnetworks: false
---
# Peer spoke-1 to hub
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetworkPeering
metadata:
  name: spoke1-to-hub
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: spoke1-project
spec:
  networkRef:
    external: projects/spoke1-project/global/networks/spoke1-vpc
  peerNetworkRef:
    external: projects/hub-project/global/networks/hub-vpc
  exportCustomRoutes: true
  importCustomRoutes: true
```

---

### 42. Traffic Director for Proxyless gRPC (xDS)
Configure Traffic Director as a service mesh control plane.

```bash
# Enable Traffic Director
gcloud services enable trafficdirector.googleapis.com

# Create a Traffic Director forwarding rule
gcloud compute forwarding-rules create td-rule \
  --global \
  --load-balancing-scheme INTERNAL_SELF_MANAGED \
  --address 0.0.0.0 \
  --port-range 80 \
  --target-http-proxy td-proxy
```

---

### 43. GKE Dataplane V2 — Cilium Network Policy
Use Cilium-compatible network policies with GKE Dataplane V2.

```yaml
# L7 network policy using Cilium (via GKE Dataplane V2)
apiVersion: "cilium.io/v2"
kind: CiliumNetworkPolicy
metadata:
  name: l7-policy
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: backend
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: frontend
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
          rules:
            http:
              - method: GET
                path: "/api/.*"
              - method: POST
                path: "/api/items"
```

---

### 44. Cloud NAT with Port Override for High-Concurrency GKE
Configure Cloud NAT for clusters with many concurrent connections.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouterNAT
metadata:
  name: high-concurrency-nat
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  routerRef:
    name: app-router
  natIpAllocateOption: AUTO_ONLY
  sourceSubnetworkIpRangesToNat: ALL_SUBNETWORKS_ALL_IP_RANGES
  minPortsPerVm: 4096        # increase for high concurrency
  maxPortsPerVm: 65536
  enableDynamicPortAllocation: true
  tcpEstablishedIdleTimeoutSec: 1200
  tcpTimeWaitTimeoutSec: 120
  udpIdleTimeoutSec: 30
```

---

### 45. Packet Mirroring for Network Forensics
Mirror GKE node traffic for security analysis.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputePacketMirroring
metadata:
  name: gke-node-mirroring
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: production-vpc
  collectorIlbRef:
    name: ids-collector-ilb
  mirroredResources:
    tags:
      - gke-production-node
  filter:
    cidrRanges:
      - 10.0.0.0/8
    ipProtocols:
      - tcp
      - udp
  description: "Mirror GKE traffic for IDS"
```

---

### 46. Private GKE Cluster with PSC for Google APIs
Use Private Service Connect endpoints for all Google API access.

```yaml
apiVersion: container.cnrm.cloud.google.com/v1beta1
kind: ContainerCluster
metadata:
  name: psc-gke-cluster
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  networkRef:
    name: production-vpc
  subnetworkRef:
    name: gke-nodes-subnet
  privateClusterConfig:
    enablePrivateNodes: true
    enablePrivateEndpoint: true
    masterIpv4CidrBlock: 172.16.0.0/28
  ipAllocationPolicy:
    useIpAliases: true
  dnsConfig:
    clusterDns: CLOUD_DNS
    clusterDnsScope: PRIVATE_DNS_SCOPE
    clusterDnsDomain: cluster.local
  initialNodeCount: 2
```

---

### 47. Network Intelligence Center — Network Topology
Visualize and audit the GKE network topology.

```bash
# Enable Network Intelligence Center
gcloud services enable networkmanagement.googleapis.com

# Run a network topology analysis
gcloud network-management connectivity-tests list \
  --project my-gcp-project

# Check network topology
gcloud compute network-topology \
  --project my-gcp-project \
  --format json | jq '.entities[] | select(.type == "SUBNET")'
```

---

### 48. HA VPN with BGP for On-Premises Connectivity
Configure an HA VPN with BGP routing for production on-premises connectivity.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeHaVpnGateway
metadata:
  name: ha-vpn-gateway
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: production-vpc
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouterInterface
metadata:
  name: vpn-bgp-interface
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  routerRef:
    name: app-router
  ipRange: 169.254.0.1/30
  vpnTunnelRef:
    name: vpn-to-onprem
```

---

### 49. Cloud Armor Adaptive Protection
Enable ML-based DDoS protection for GKE ingress.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSecurityPolicy
metadata:
  name: adaptive-protection-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  description: "Cloud Armor with Adaptive Protection"
  adaptiveProtectionConfig:
    layer7DdosDefenseConfig:
      enable: true
      ruleVisibility: STANDARD
  advancedOptionsConfig:
    logLevel: VERBOSE
    jsonCustomConfig:
      contentTypes:
        - application/json
  rule:
    - priority: 1000
      action: allow
      match:
        versionedExpr: SRC_IPS_V1
        config:
          srcIpRanges: ["*"]
      description: "Allow all - adaptive protection will auto-block attacks"
    - priority: 2147483647
      action: allow
      match:
        versionedExpr: SRC_IPS_V1
        config:
          srcIpRanges: ["*"]
      description: "Default allow"
```

---

### 50. Full Production Network Stack
Complete network infrastructure for a production GKE deployment.

```yaml
# VPC
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: prod-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  autoCreateSubnetworks: false
  routingConfig:
    routingMode: REGIONAL
---
# GKE Subnet with secondary ranges and flow logs
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: prod-gke-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.0.0.0/16
  networkRef:
    name: prod-vpc
  privateIpGoogleAccess: true
  secondaryIpRange:
    - rangeName: pods
      ipCidrRange: 10.1.0.0/16
    - rangeName: services
      ipCidrRange: 10.2.0.0/20
  logConfig:
    enable: true
    aggregationInterval: INTERVAL_5_SEC
    flowSampling: 0.5
    metadata: INCLUDE_ALL_METADATA
---
# Cloud Router
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouter
metadata:
  name: prod-router
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: prod-vpc
---
# Cloud NAT for private nodes
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouterNAT
metadata:
  name: prod-nat
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  routerRef:
    name: prod-router
  natIpAllocateOption: AUTO_ONLY
  sourceSubnetworkIpRangesToNat: ALL_SUBNETWORKS_ALL_IP_RANGES
  minPortsPerVm: 2048
  enableDynamicPortAllocation: true
  logConfig:
    enable: true
    filter: ERRORS_ONLY
---
# Baseline firewall rules
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: prod-allow-internal
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: prod-vpc
  direction: INGRESS
  allowed:
    - ipProtocol: tcp
    - ipProtocol: udp
    - ipProtocol: icmp
  sourceRanges:
    - 10.0.0.0/8
  priority: 1000
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: prod-allow-iap-ssh
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: prod-vpc
  direction: INGRESS
  allowed:
    - ipProtocol: tcp
      ports:
        - "22"
  sourceRanges:
    - 35.235.240.0/20   # IAP range
  priority: 1000


---

## Expert

### 51. KCC — ComputeRouter (Cloud Router)
Create a Cloud Router required for Cloud NAT or VPN BGP sessions.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouter
metadata:
  name: nat-router
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: my-vpc
  bgp:
    asn: 65000
    advertiseMode: DEFAULT
```

---

### 52. KCC — ComputeRouterNAT (Cloud NAT)
Enable outbound internet access for private GKE nodes.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouterNAT
metadata:
  name: prod-nat
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  routerRef:
    name: nat-router
  natIpAllocateOption: AUTO_ONLY
  sourceSubnetworkIpRangesToNat: ALL_SUBNETWORKS_ALL_IP_RANGES
  logConfig:
    enable: true
    filter: ERRORS_ONLY
```

---

### 53. KCC — ComputeVPNGateway and ComputeVPNTunnel
Provision an HA VPN gateway and tunnel for site-to-site connectivity.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeVPNGateway
metadata:
  name: ha-vpn-gateway
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: my-vpc
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeVPNTunnel
metadata:
  name: vpn-tunnel-0
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  vpnGatewayRef:
    name: ha-vpn-gateway
  vpnGatewayInterface: 0
  sharedSecret: my-shared-secret
  ikeVersion: 2
  routerRef:
    name: nat-router
  peerExternalGatewayInterface: 0
```

---

### 54. KCC — DNSManagedZone (Public)
Create a public Cloud DNS zone for external domain resolution.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSManagedZone
metadata:
  name: example-com-zone
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  dnsName: "example.com."
  description: "Public zone for example.com"
  visibility: public
```

---

### 55. KCC — DNSManagedZone (Private)
Create a private DNS zone visible only within a VPC.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSManagedZone
metadata:
  name: internal-dns-zone
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  dnsName: "internal.prod.example.com."
  visibility: private
  privateVisibilityConfig:
    networks:
    - networkRef:
        name: my-vpc
```

---

### 56. KCC — DNSRecordSet (A Record)
Create an A record in a Cloud DNS managed zone.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSRecordSet
metadata:
  name: api-a-record
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  managedZoneRef:
    name: example-com-zone
  name: "api.example.com."
  type: A
  ttl: 300
  rrdatas:
  - 34.120.0.100
```

---

### 57. KCC — ComputeSharedVPCHostProject and ServiceProject
Enable Shared VPC and attach a service project to the host project.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSharedVPCHostProject
metadata:
  name: host-vpc-enable
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: host-project-id
spec:
  resourceID: host-project-id
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSharedVPCServiceProject
metadata:
  name: attach-service-project
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: host-project-id
spec:
  serviceProjectRef:
    external: service-project-id
```

---

### 58. KCC — ComputeFirewallPolicy (Hierarchical)
Create an organization-level hierarchical firewall policy.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewallPolicy
metadata:
  name: org-baseline-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  parent: organizations/123456789
  shortName: org-baseline
  description: "Baseline firewall policy applied to all projects"
```

---

### 59. KCC — ComputeSecurityPolicy (Cloud Armor with Rate Limiting)
Deploy a Cloud Armor WAF policy with rate-based banning via KCC.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSecurityPolicy
metadata:
  name: waf-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  description: "WAF with rate limiting"
  rules:
  - action: rate_based_ban
    priority: 1000
    match:
      versionedExpr: SRC_IPS_V1
      config:
        srcIpRanges:
        - "*"
    rateLimitOptions:
      rateLimitThreshold:
        count: 500
        intervalSec: 60
      banDurationSec: 300
  - action: allow
    priority: 2147483647
    match:
      versionedExpr: SRC_IPS_V1
      config:
        srcIpRanges:
        - "*"
```

---

### 60. KCC — ComputeRoute (Custom Static Route)
Direct specific CIDR traffic to a VPN tunnel or custom next-hop.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRoute
metadata:
  name: onprem-route
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: my-vpc
  destRange: 192.168.0.0/16
  priority: 100
  nextHopVpnTunnelRef:
    name: vpn-tunnel-0
    region: us-central1
```

---

### 61. KCC — ComputeAddress (Reserve Global Static IP)
Reserve a global static IP for use with an Application Load Balancer.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: app-global-ip
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  addressType: EXTERNAL
  ipVersion: IPV4
  description: "Global static IP for production load balancer"
```

---

### 62. KCC — ComputeNetworkPeering (VPC Peering)
Peer two VPCs for private communication without NAT.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetworkPeering
metadata:
  name: vpc-peer-to-shared
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: my-vpc
  peerNetworkRef:
    external: projects/shared-project/global/networks/shared-vpc
  exportCustomRoutes: true
  importCustomRoutes: true
```

---

### 63. KCC — ComputeSubnetwork with Private Google Access and Flow Logs
Enable PGA and VPC Flow Logs on a GKE subnet for security and observability.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: gke-nodes-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.10.0.0/24
  networkRef:
    name: my-vpc
  privateIpGoogleAccess: true
  logConfig:
    enable: true
    flowSampling: 0.5
    metadata: INCLUDE_ALL_METADATA
```

---

### 64. KCC — ComputeFirewall for GKE Master Webhook Access
Allow the GKE control plane to call admission webhook pods running in the cluster.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-master-to-webhooks
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: my-vpc
  direction: INGRESS
  allows:
  - protocol: tcp
    ports:
    - "8443"
    - "9443"
  sourceTags:
  - gke-my-cluster-master
  targetTags:
  - gke-my-cluster-nodes
```

---

### 65. KCC — Full Network Stack: VPC + Subnet + NAT + DNS
Bootstrap complete network infrastructure in a single KCC apply.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: production-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  autoCreateSubnetworks: false
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: gke-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: 10.0.0.0/20
  networkRef:
    name: production-vpc
  privateIpGoogleAccess: true
  secondaryIpRange:
  - rangeName: pods
    ipCidrRange: 10.4.0.0/14
  - rangeName: services
    ipCidrRange: 10.0.16.0/20
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouter
metadata:
  name: prod-nat-router
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: production-vpc
  bgp:
    asn: 65001
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouterNAT
metadata:
  name: prod-nat
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  routerRef:
    name: prod-nat-router
  natIpAllocateOption: AUTO_ONLY
  sourceSubnetworkIpRangesToNat: ALL_SUBNETWORKS_ALL_IP_RANGES
---
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSManagedZone
metadata:
  name: prod-internal-dns
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  dnsName: "prod.internal."
  visibility: private
  privateVisibilityConfig:
    networks:
    - networkRef:
        name: production-vpc
