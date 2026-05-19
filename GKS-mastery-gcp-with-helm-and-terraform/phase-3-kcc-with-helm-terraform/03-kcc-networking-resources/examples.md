# KCC Networking Resources — GCP/GKE with Terraform and Helm

> **Stack:** Kubernetes Config Connector (KCC) · Terraform google provider ~> 5.0 · Helm 3  
> **Project:** `my-gcp-project` · **Cluster:** `my-gke-cluster` · **Region:** `us-central1`  
> **API groups:** `compute.cnrm.cloud.google.com/v1beta1` · `dns.cnrm.cloud.google.com/v1beta1`

---

## BASIC (Examples 1–13)

### Example 1: ComputeNetwork — Create a Custom VPC
**Concept:** KCC `ComputeNetwork` maps directly to a GCP VPC network and manages its lifecycle through the Kubernetes API.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: gke-vpc
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  autoCreateSubnetworks: false
  routingConfig:
    routingMode: REGIONAL
  description: "Primary VPC for GKE workloads in us-central1"
  deleteDefaultRoutesOnCreate: false
```

**Explanation:** Setting `autoCreateSubnetworks: false` gives full control over subnet CIDR allocation, which is required for GKE clusters that use Alias IP ranges. The `routingMode: REGIONAL` setting ensures route advertisements stay within the region, reducing latency for intra-region pod traffic. KCC watches this resource and reconciles it against the GCP API continuously.

---

### Example 2: ComputeSubnetwork — Subnet with Secondary Ranges for GKE Pods and Services
**Concept:** `ComputeSubnetwork` with `secondaryIpRanges` provides the dedicated CIDR blocks that GKE uses for Pod and Service IP allocation in VPC-native clusters.

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
  ipCidrRange: "10.0.0.0/20"
  networkRef:
    name: gke-vpc
  privateIpGoogleAccess: true
  secondaryIpRanges:
    - rangeName: gke-pods
      ipCidrRange: "10.4.0.0/14"
    - rangeName: gke-services
      ipCidrRange: "10.8.0.0/20"
  description: "GKE node subnet with pod and service ranges"
  logConfig:
    aggregationInterval: INTERVAL_5_SEC
    flowSampling: 0.5
    metadata: INCLUDE_ALL_METADATA
```

**Explanation:** The `gke-pods` range (`/14`) supports up to ~262,000 pod IPs across nodes, while `gke-services` (`/20`) provides 4096 cluster IP addresses. `privateIpGoogleAccess: true` allows nodes without external IPs to reach Google APIs and services. VPC Flow Logs are enabled here for network observability, which is best practice in production.

---

### Example 3: ComputeFirewall — Ingress Rule for GKE Node-to-Node Traffic
**Concept:** A KCC `ComputeFirewall` resource declaratively manages GCP firewall rules that control ingress and egress traffic to compute instances.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-gke-internal
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: gke-vpc
  direction: INGRESS
  priority: 1000
  allow:
    - protocol: tcp
      ports:
        - "0-65535"
    - protocol: udp
      ports:
        - "0-65535"
    - protocol: icmp
  sourceRanges:
    - "10.0.0.0/20"
    - "10.4.0.0/14"
    - "10.8.0.0/20"
  description: "Allow all internal traffic between GKE nodes, pods, and services"
  logConfig:
    metadata: INCLUDE_ALL_METADATA
```

**Explanation:** This rule permits all TCP, UDP, and ICMP traffic originating from the node subnet, pod CIDR, and service CIDR — covering the full VPC-native address space. Without this rule, GKE control-plane health checks and node-to-pod communication would fail. The `logConfig` block enables firewall rule logging for audit and debugging purposes.

---

### Example 4: ComputeFirewall — Egress Allow-All with Deny Override Pattern
**Concept:** Defining explicit egress rules with KCC enables a least-privilege outbound policy for GKE workloads, overriding the default allow-all egress behavior.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: deny-all-egress
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: gke-vpc
  direction: EGRESS
  priority: 65534
  deny:
    - protocol: all
  destinationRanges:
    - "0.0.0.0/0"
  description: "Default deny all egress — higher-priority rules allow specific traffic"
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-google-apis-egress
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: gke-vpc
  direction: EGRESS
  priority: 1000
  allow:
    - protocol: tcp
      ports:
        - "443"
  destinationRanges:
    - "199.36.153.4/30"
  description: "Allow egress to Private Google Access restricted VIP"
```

**Explanation:** The deny-all egress rule at priority 65534 acts as a catch-all, while specific lower-numbered (higher-priority) rules punch through for required traffic. The second rule allows HTTPS egress to the `restricted.googleapis.com` VIP (`199.36.153.4/30`), enabling Private Google Access for services like Artifact Registry and Cloud Storage. This pattern aligns with CIS GKE Benchmark recommendations.

---

### Example 5: ComputeRouter — Cloud Router for NAT Gateway
**Concept:** `ComputeRouter` creates a Cloud Router that acts as the BGP speaker and NAT anchor for a VPC region.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouter
metadata:
  name: gke-router
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: gke-vpc
  description: "Cloud Router for NAT and potential BGP peering in us-central1"
  bgp:
    asn: 64514
    advertiseMode: CUSTOM
    advertisedGroups:
      - ALL_SUBNETS
```

**Explanation:** A Cloud Router is a prerequisite for Cloud NAT — KCC will create the router in GCP and the `ComputeRouterNAT` resource references it by name. The `asn: 64514` is a private ASN commonly used for Cloud Routers in non-interconnect scenarios. The `ALL_SUBNETS` advertise group ensures all subnetworks in the region are included in route advertisements, which is the standard configuration.

---

### Example 6: ComputeRouterNAT — Cloud NAT for Private GKE Nodes
**Concept:** `ComputeRouterNAT` configures Cloud NAT on an existing Cloud Router, giving private GKE nodes outbound internet access without public IP addresses.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRouterNAT
metadata:
  name: gke-nat
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  routerRef:
    name: gke-router
  natIpAllocateOption: AUTO_ONLY
  sourceSubnetworkIpRangesToNat: LIST_OF_SUBNETWORKS
  subnetwork:
    - subnetworkRef:
        name: gke-nodes-subnet
      sourceIpRangesToNat:
        - ALL_IP_RANGES
  logConfig:
    enable: true
    filter: ERRORS_ONLY
  minPortsPerVm: 64
  enableDynamicPortAllocation: true
  tcpEstablishedIdleTimeoutSec: 1200
  tcpTransitoryIdleTimeoutSec: 30
```

**Explanation:** `AUTO_ONLY` tells Cloud NAT to manage external IP allocation automatically, removing the need to reserve static NAT IPs. `enableDynamicPortAllocation: true` allows NAT to scale port usage per VM dynamically, preventing SNAT port exhaustion under burst traffic. Setting `LIST_OF_SUBNETWORKS` restricts NAT to the explicitly listed subnet, which avoids accidentally NATing traffic from other subnets in the VPC.

---

### Example 7: ComputeAddress — Reserve a Regional Static IP
**Concept:** `ComputeAddress` reserves a static IP address in GCP that can be assigned to a load balancer forwarding rule or a VM instance.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeAddress
metadata:
  name: gke-ingress-static-ip
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  addressType: EXTERNAL
  networkTier: STANDARD
  description: "Static external IP for regional GKE ingress load balancer"
```

**Explanation:** A regional `ComputeAddress` is used with regional (Layer 4) load balancers, whereas global addresses (shown later) are used with global (Layer 7) HTTPS load balancers. The `STANDARD` network tier is cost-effective for single-region traffic; use `PREMIUM` for global anycast routing. Once KCC creates this resource, the assigned IP is available in the resource's `.status.address` field.

---

### Example 8: ComputeHealthCheck — HTTP Health Check for Backend Services
**Concept:** `ComputeHealthCheck` defines how GCP probes backend instances to determine their health before routing traffic to them.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeHealthCheck
metadata:
  name: gke-http-health-check
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  httpHealthCheck:
    port: 8080
    requestPath: /healthz
    proxyHeader: NONE
  checkIntervalSec: 10
  timeoutSec: 5
  healthyThreshold: 2
  unhealthyThreshold: 3
  description: "HTTP health check targeting /healthz on port 8080"
  logConfig:
    enable: true
```

**Explanation:** The `/healthz` path is the standard Kubernetes liveness probe convention, making it a consistent target for GCP health checks on GKE-backed backends. Setting `unhealthyThreshold: 3` prevents flapping by requiring three consecutive failures before marking a backend unhealthy. Health check logging (`logConfig.enable: true`) is invaluable for diagnosing probe failures during deployments or rolling updates.

---

### Example 9: ComputeBackendService — Backend Service Referencing a NEG
**Concept:** `ComputeBackendService` defines the backend pool for a load balancer, and when used with GKE, it references Network Endpoint Groups (NEGs) for container-native load balancing.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeBackendService
metadata:
  name: gke-backend-service
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  loadBalancingScheme: EXTERNAL_MANAGED
  protocol: HTTP
  port: 8080
  portName: http
  timeoutSec: 30
  healthChecks:
    - healthCheckRef:
        name: gke-http-health-check
  backend:
    - group: "projects/my-gcp-project/zones/us-central1-a/networkEndpointGroups/my-gke-cluster-neg"
      balancingMode: RATE
      maxRatePerEndpoint: 100
  connectionDraining:
    drainingTimeoutSec: 60
  logConfig:
    enable: true
    sampleRate: 1.0
  cdnPolicy:
    cacheMode: USE_ORIGIN_HEADERS
```

**Explanation:** Using `EXTERNAL_MANAGED` scheme enables the global Application Load Balancer path, which provides advanced traffic management features. Container-native load balancing via NEGs routes traffic directly to pod IP addresses, bypassing the kube-proxy iptables layer and reducing hop count. `drainingTimeoutSec: 60` ensures in-flight connections complete gracefully during pod termination.

---

### Example 10: Resource Annotations — Project, Namespace, and Deletion Policy
**Concept:** KCC annotations on networking resources control which GCP project owns the resource, how conflicts are handled, and what happens to the GCP resource when the Kubernetes object is deleted.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetwork
metadata:
  name: annotated-vpc
  namespace: config-connector
  annotations:
    # Target GCP project for this resource
    cnrm.cloud.google.com/project-id: my-gcp-project
    # Abandon the GCP resource instead of deleting it when the K8s object is removed
    cnrm.cloud.google.com/deletion-policy: abandon
    # Prevent KCC from modifying this resource (read-only management)
    cnrm.cloud.google.com/management-conflict-prevention-policy: resource
    # Associate with a specific KCC service account for multi-tenancy
    cnrm.cloud.google.com/blueprint: "kcc/v1"
  labels:
    environment: production
    managed-by: kcc
    team: platform
spec:
  autoCreateSubnetworks: false
  routingConfig:
    routingMode: REGIONAL
```

**Explanation:** The `deletion-policy: abandon` annotation is critical for production networking resources — it prevents accidental VPC deletion if someone deletes the KCC manifest. The `management-conflict-prevention-policy: resource` annotation makes KCC the authoritative owner, preventing manual GCP Console changes from drifting out of sync. Labels propagate to the GCP resource and are useful for cost attribution and resource grouping.

---

### Example 11: Status Checking — Inspecting KCC Resource Conditions
**Concept:** KCC networking resources expose their GCP reconciliation status through standard Kubernetes `.status.conditions`, enabling GitOps pipelines and operators to gate on resource readiness.

```bash
# Check if a ComputeNetwork is ready
kubectl get computenetwork gke-vpc -n config-connector -o jsonpath='{.status.conditions}'

# Watch all networking resources in the config-connector namespace
kubectl get computenetwork,computesubnetwork,computefirewall,computerouter \
  -n config-connector \
  -o custom-columns="NAME:.metadata.name,READY:.status.conditions[?(@.type=='Ready')].status,REASON:.status.conditions[?(@.type=='Ready')].reason"

# Describe a specific resource to see full status and events
kubectl describe computesubnetwork gke-nodes-subnet -n config-connector

# Wait for ComputeRouterNAT to become Ready
kubectl wait computerouternat/gke-nat \
  --for=condition=Ready \
  --timeout=120s \
  -n config-connector
```

**Explanation:** KCC surfaces a `Ready` condition that transitions to `True` once the GCP API confirms the resource exists and matches the desired spec. A `reason` of `UpToDate` confirms the resource is fully reconciled; `Updating` means KCC is applying changes; `ManagementConflict` means the resource was modified outside of KCC. The `kubectl wait` command is especially useful in CI/CD pipelines to block downstream steps until networking infrastructure is confirmed ready.

---

### Example 12: ComputeFirewall — Allow GKE Master to Nodes (Control Plane Webhook Traffic)
**Concept:** GKE requires specific firewall rules to allow the control plane to reach node ports for webhook admission controllers and API aggregation.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-gke-master-to-nodes
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: gke-vpc
  direction: INGRESS
  priority: 1000
  allow:
    - protocol: tcp
      ports:
        - "443"
        - "8443"
        - "9443"
        - "15017"
  sourceTags:
    - gke-my-gke-cluster-master
  targetTags:
    - gke-my-gke-cluster
  description: "Allow GKE control plane to reach node admission webhook ports"
```

**Explanation:** Without this rule, mutating and validating admission webhooks (such as Istio's sidecar injector or OPA Gatekeeper) will fail because the API server cannot reach the webhook service running on nodes. Port `8443` is the default for many admission webhooks, while `15017` is used by Istio's Pilot discovery service. `sourceTags` and `targetTags` use GKE's auto-assigned network tags, which follow the pattern `gke-<cluster-name>-master` and `gke-<cluster-name>`.

---

### Example 13: ComputeSubnetwork — Proxy-Only Subnet for Internal Application Load Balancer
**Concept:** Internal Application Load Balancers (Layer 7) require a dedicated proxy-only subnet in the same region for the Envoy proxy fleet managed by GCP.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: proxy-only-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: "10.129.0.0/23"
  networkRef:
    name: gke-vpc
  purpose: REGIONAL_MANAGED_PROXY
  role: ACTIVE
  description: "Proxy-only subnet for internal Application Load Balancer in us-central1"
```

**Explanation:** The `purpose: REGIONAL_MANAGED_PROXY` value designates this subnet exclusively for GCP-managed proxy instances — it cannot be used for VM or pod IPs. The `role: ACTIVE` field marks it as the active proxy subnet; a second subnet with `role: BACKUP` can be defined for failover. This subnet must exist before creating any internal Application Load Balancer forwarding rule in the same region and VPC.

---

## INTERMEDIATE (Examples 14–26)

### Example 14: ComputeForwardingRule — Regional Internal Load Balancer
**Concept:** `ComputeForwardingRule` is the frontend entry point of a GCP load balancer, binding an IP address and port to a backend target proxy or backend service.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeForwardingRule
metadata:
  name: gke-internal-forwarding-rule
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: us-central1
  loadBalancingScheme: INTERNAL_MANAGED
  networkRef:
    name: gke-vpc
  subnetworkRef:
    name: gke-nodes-subnet
  portRange: "80"
  target:
    targetHTTPProxyRef:
      name: gke-internal-http-proxy
  ipProtocol: TCP
  description: "Internal forwarding rule for GKE-backed services"
  allowGlobalAccess: true
```

**Explanation:** `INTERNAL_MANAGED` creates an internal Application Load Balancer, while `allowGlobalAccess: true` permits clients in other regions of the same VPC to reach this load balancer — essential for multi-region GKE clusters. The forwarding rule references a `ComputeTargetHTTPProxy` which in turn references a URL map, forming the full L7 routing chain. When no IP address is specified, GCP auto-assigns one from the referenced subnet.

---

### Example 15: ComputeTargetHTTPSProxy — HTTPS Target Proxy
**Concept:** `ComputeTargetHTTPSProxy` terminates TLS on behalf of the load balancer, linking an SSL certificate and a URL map to define how decrypted requests are routed.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeTargetHTTPSProxy
metadata:
  name: gke-https-proxy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  urlMapRef:
    name: gke-url-map
  sslCertificates:
    - sslCertificateRef:
        name: gke-managed-cert
  sslPolicy:
    sslPolicyRef:
      name: gke-ssl-policy
  description: "HTTPS target proxy for global external load balancer"
  quicOverride: ENABLE
```

**Explanation:** The proxy links three components: the URL map (routing logic), one or more SSL certificates (TLS identity), and an optional SSL policy (cipher and protocol enforcement). `quicOverride: ENABLE` activates HTTP/3 (QUIC) support on the load balancer, which reduces latency for clients that support it. Multiple certificates can be listed to support SNI-based routing for multiple domains behind a single proxy.

---

### Example 16: ComputeURLMap — Path-Based Routing for Multiple GKE Services
**Concept:** `ComputeURLMap` defines the L7 routing rules that map incoming HTTP/HTTPS request host and path patterns to specific backend services.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeURLMap
metadata:
  name: gke-url-map
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  defaultService:
    backendServiceRef:
      name: gke-backend-service
  hostRule:
    - hosts:
        - "api.my-gcp-project.example.com"
      pathMatcher: api-matcher
    - hosts:
        - "web.my-gcp-project.example.com"
      pathMatcher: web-matcher
  pathMatcher:
    - name: api-matcher
      defaultService:
        backendServiceRef:
          name: gke-backend-service
      pathRule:
        - paths:
            - "/v1/*"
            - "/v2/*"
          service:
            backendServiceRef:
              name: gke-api-v2-backend
        - paths:
            - "/health"
          service:
            backendServiceRef:
              name: gke-health-backend
    - name: web-matcher
      defaultService:
        backendServiceRef:
          name: gke-web-backend
```

**Explanation:** Host rules first match the incoming `Host` header to a path matcher, and then path rules within that matcher direct traffic to the appropriate backend service. The `defaultService` acts as the catch-all when no path rule matches, preventing 404 errors for unmatched requests. This single URL map can replace multiple Kubernetes Ingress objects, centralizing routing logic in a KCC-managed GCP resource.

---

### Example 17: ComputeSSLCertificate — Google-Managed Certificate
**Concept:** A Google-managed `ComputeSSLCertificate` automates TLS certificate provisioning and renewal through Google's Certificate Authority, eliminating manual cert-bot workflows.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSSLCertificate
metadata:
  name: gke-managed-cert
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  managed:
    domains:
      - api.my-gcp-project.example.com
      - web.my-gcp-project.example.com
      - www.my-gcp-project.example.com
  description: "Google-managed TLS certificate for GKE load balancer domains"
```

**Explanation:** Google-managed certificates are provisioned asynchronously after DNS records point to the load balancer's IP — the cert status transitions through `PROVISIONING` to `ACTIVE` once domain ownership is verified via HTTP challenge. A single managed certificate resource can cover up to 100 domains. Unlike self-managed certificates, Google handles all renewal automatically, with no manual rotation required before the 90-day Let's Encrypt expiry.

---

### Example 18: ComputeGlobalAddress — Reserve a Global Anycast IP
**Concept:** `ComputeGlobalAddress` reserves a premium-tier anycast IP address that is announced from all Google Points of Presence globally, required for global (Layer 7) HTTP(S) load balancers.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeGlobalAddress
metadata:
  name: gke-global-lb-ip
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  addressType: EXTERNAL
  ipVersion: IPV4
  description: "Global anycast IP for GKE HTTPS load balancer"
```

**Explanation:** Global addresses differ from regional addresses in that they are always assigned from the PREMIUM network tier and cannot be used with regional (Layer 4) load balancers. The IP address is surfaced in `.status.address` after KCC creates the resource, and it should be recorded as a DNS A record pointing to the load balancer domain. Reserving the address before creating the forwarding rule allows DNS records to be pre-configured.

---

### Example 19: DNSManagedZone — Create a Cloud DNS Zone
**Concept:** `DNSManagedZone` creates a Cloud DNS zone that maps a domain name to Google-managed authoritative name servers, enabling DNS record management through KCC.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSManagedZone
metadata:
  name: my-gcp-project-zone
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  dnsName: "my-gcp-project.example.com."
  visibility: public
  description: "Public DNS zone for GKE-hosted services"
  dnssecConfig:
    state: on
    defaultKeySpecs:
      - algorithm: rsasha256
        keyLength: 2048
        keyType: keySigning
      - algorithm: rsasha256
        keyLength: 1024
        keyType: zoneSigning
  cloudLoggingConfig:
    enableLogging: true
```

**Explanation:** The trailing dot in `dnsName` is required by RFC 1035 and Cloud DNS — KCC validates this format. DNSSEC is enabled here with RSA/SHA256 key signing to protect zone data integrity and prevent DNS spoofing attacks. Cloud DNS query logging is enabled for security monitoring and troubleshooting DNS resolution issues for GKE services. After creation, delegate the zone by updating the registrar's NS records to match `.status.nameServers`.

---

### Example 20: DNSRecordSet — A Record Pointing to Global Load Balancer IP
**Concept:** `DNSRecordSet` creates DNS records within a `DNSManagedZone`, allowing KCC to manage the full lifecycle of domain-to-IP mappings alongside the infrastructure they reference.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSRecordSet
metadata:
  name: api-dns-record
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  managedZoneRef:
    name: my-gcp-project-zone
  name: "api.my-gcp-project.example.com."
  type: A
  ttl: 300
  rrdatas:
    - "34.120.50.100"
---
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSRecordSet
metadata:
  name: web-dns-record
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  managedZoneRef:
    name: my-gcp-project-zone
  name: "web.my-gcp-project.example.com."
  type: CNAME
  ttl: 300
  rrdatas:
    - "api.my-gcp-project.example.com."
```

**Explanation:** The IP address `34.120.50.100` should match the value from the `ComputeGlobalAddress` resource's `.status.address` field. In a GitOps pipeline, this value can be sourced dynamically using a `ConfigConnectorContext` or an external-dns controller that writes DNS records based on Service/Ingress annotations. The TTL of 300 seconds (5 minutes) is short enough for quick failover while not hammering DNS resolvers.

---

### Example 21: ComputeNetworkPeering — VPC Peering Between Two Networks
**Concept:** `ComputeNetworkPeering` establishes a private routing connection between two VPC networks, enabling direct RFC-1918 communication without traversing the public internet or a VPN.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeNetworkPeering
metadata:
  name: gke-vpc-to-services-vpc-peering
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: gke-vpc
  peerNetworkRef:
    external: "projects/my-gcp-project/global/networks/services-vpc"
  exportCustomRoutes: true
  importCustomRoutes: true
  exportSubnetRoutesWithPublicIp: false
  stackType: IPV4_ONLY
```

**Explanation:** VPC peering is non-transitive — if VPC-A peers with VPC-B and VPC-B peers with VPC-C, VPC-A cannot reach VPC-C through VPC-B. Both sides of the peering must create a `ComputeNetworkPeering` resource (or equivalent) for the peering to become `ACTIVE`. `exportCustomRoutes: true` shares static and dynamic routes across the peering, which is necessary when a Cloud Router advertises custom routes that peered networks need to consume.

---

### Example 22: Private Google Access — Enable on Existing Subnet via Patch
**Concept:** Private Google Access allows VM instances and GKE pods that only have internal IP addresses to reach Google APIs and services using internal routing via the VPC.

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
  ipCidrRange: "10.0.0.0/20"
  networkRef:
    name: gke-vpc
  privateIpGoogleAccess: true
  privateIpv6GoogleAccess: DISABLE_GOOGLE_ACCESS
  secondaryIpRanges:
    - rangeName: gke-pods
      ipCidrRange: "10.4.0.0/14"
    - rangeName: gke-services
      ipCidrRange: "10.8.0.0/20"
  purpose: PRIVATE
```

**Explanation:** Setting `privateIpGoogleAccess: true` enables the subnet-level flag that routes traffic destined for `*.googleapis.com` through the private VPC backbone rather than the public internet. For GKE clusters with private nodes, this is mandatory for pulling images from Artifact Registry (`us-central1-docker.pkg.dev`) and writing logs to Cloud Logging. KCC will update the existing subnet in place when this field changes, making it easy to retrofit existing infrastructure.

---

### Example 23: ComputeFirewall — Target Service Account for Zero-Trust Ingress
**Concept:** Using a service account as a firewall target instead of network tags provides identity-based access control that is harder to circumvent and aligns with zero-trust networking principles.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-backend-to-database
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: gke-vpc
  direction: INGRESS
  priority: 900
  allow:
    - protocol: tcp
      ports:
        - "5432"
  sourceServiceAccounts:
    - backend-ksa@my-gcp-project.iam.gserviceaccount.com
  targetServiceAccounts:
    - database-ksa@my-gcp-project.iam.gserviceaccount.com
  description: "Allow backend service account to reach database on PostgreSQL port"
  logConfig:
    metadata: INCLUDE_ALL_METADATA
```

**Explanation:** Service account-based firewall rules are enforced regardless of which network tags are applied to an instance, making them immune to tag manipulation by users with `compute.instances.setTags` permission. In GKE, Workload Identity binds a Kubernetes ServiceAccount to a GCP ServiceAccount, so pod-level identity flows into firewall enforcement. This pattern is recommended for database access control in Shared VPC environments where tag governance is harder.

---

### Example 24: ComputeSSLPolicy — Enforce Modern TLS Versions
**Concept:** `ComputeSSLPolicy` defines the minimum TLS version and cipher suite profile enforced by a target HTTPS proxy, ensuring load balancers reject outdated protocol versions.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSSLPolicy
metadata:
  name: gke-ssl-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  minTlsVersion: TLS_1_2
  profile: RESTRICTED
  description: "Restrict TLS to 1.2+ with RESTRICTED cipher suite for GKE LB"
```

**Explanation:** The `RESTRICTED` profile disables weak cipher suites (RC4, 3DES, and export ciphers) and enforces forward secrecy, meeting PCI-DSS and HIPAA transport security requirements. `TLS_1_2` is the minimum — GCP does not support TLS 1.0 or 1.1 on managed load balancers as of 2022. This SSL policy should be referenced in every `ComputeTargetHTTPSProxy` to enforce consistent security posture across all load balancer frontends.

---

### Example 25: ComputeGlobalForwardingRule — Global HTTPS Forwarding Rule
**Concept:** A global `ComputeForwardingRule` (with `location: global`) binds a reserved global anycast IP to a target HTTPS proxy, completing the frontend configuration of a global Application Load Balancer.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeForwardingRule
metadata:
  name: gke-global-https-forwarding-rule
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  loadBalancingScheme: EXTERNAL_MANAGED
  ipAddressRef:
    name: gke-global-lb-ip
  portRange: "443"
  target:
    targetHTTPSProxyRef:
      name: gke-https-proxy
  ipProtocol: TCP
  description: "Global HTTPS forwarding rule for GKE application load balancer"
```

**Explanation:** Setting `location: global` distinguishes this from a regional forwarding rule and is required for global Application Load Balancers. The `ipAddressRef` binds the previously reserved `ComputeGlobalAddress` resource, ensuring the same IP persists across load balancer recreations. `EXTERNAL_MANAGED` is the modern load balancing scheme that uses the Envoy-based proxy architecture, replacing the legacy `EXTERNAL` scheme.

---

### Example 26: DNSRecordSet — CAA Record for Certificate Authority Authorization
**Concept:** A CAA DNS record restricts which Certificate Authorities are permitted to issue TLS certificates for a domain, preventing unauthorized certificate issuance.

```yaml
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSRecordSet
metadata:
  name: caa-record
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  managedZoneRef:
    name: my-gcp-project-zone
  name: "my-gcp-project.example.com."
  type: CAA
  ttl: 3600
  rrdatas:
    - "0 issue \"pki.goog\""
    - "0 issue \"letsencrypt.org\""
    - "0 issuewild \"pki.goog\""
    - "0 iodef \"mailto:security@my-gcp-project.example.com\""
```

**Explanation:** The `pki.goog` CA entry is required to allow Google's managed certificate service to issue certificates for the domain. The `iodef` record instructs any CA that receives an unauthorized issuance request to send a violation report to the specified email address. CAA records are a defense-in-depth measure — even if an attacker gains DNS write access, they cannot issue certs without the CAA record listing their CA.

---

## NESTED (Examples 27–38)

### Example 27: Full HTTPS LB Stack — GlobalAddress + ManagedCert + URLMap
**Concept:** Deploying the complete global HTTPS load balancer stack as a set of ordered KCC resources demonstrates how multi-resource dependencies are expressed through `Ref` fields.

```yaml
# Step 1: Global IP Address
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeGlobalAddress
metadata:
  name: app-global-ip
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  addressType: EXTERNAL
  ipVersion: IPV4
  description: "Global IP for app HTTPS LB"
---
# Step 2: Managed TLS Certificate
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSSLCertificate
metadata:
  name: app-managed-cert
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  managed:
    domains:
      - app.my-gcp-project.example.com
---
# Step 3: URL Map
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeURLMap
metadata:
  name: app-url-map
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  defaultService:
    backendServiceRef:
      name: gke-backend-service
  hostRule:
    - hosts:
        - "app.my-gcp-project.example.com"
      pathMatcher: app-paths
  pathMatcher:
    - name: app-paths
      defaultService:
        backendServiceRef:
          name: gke-backend-service
```

**Explanation:** These three resources are the foundational layer of the HTTPS LB stack. KCC resolves `Ref` fields at reconciliation time, so resources can be applied simultaneously and KCC will retry until dependencies are ready. The managed certificate begins the HTTP-01 ACME challenge as soon as the forwarding rule's IP is assigned a DNS record. Splitting the stack into a multi-document YAML file (separated by `---`) allows a single `kubectl apply -f` to deploy all components atomically.

---

### Example 28: Full HTTPS LB Stack — TargetHTTPSProxy + ForwardingRule Completion
**Concept:** This completes the HTTPS LB stack by wiring the target proxy and forwarding rule to the upstream URL map, certificate, and IP address defined in Example 27.

```yaml
# Step 4: HTTPS Target Proxy
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeTargetHTTPSProxy
metadata:
  name: app-https-proxy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  urlMapRef:
    name: app-url-map
  sslCertificates:
    - sslCertificateRef:
        name: app-managed-cert
  description: "HTTPS proxy for app global load balancer"
---
# Step 5: Global Forwarding Rule (frontend)
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeForwardingRule
metadata:
  name: app-https-forwarding-rule
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  location: global
  loadBalancingScheme: EXTERNAL_MANAGED
  ipAddressRef:
    name: app-global-ip
  portRange: "443"
  target:
    targetHTTPSProxyRef:
      name: app-https-proxy
  ipProtocol: TCP
---
# Step 6: HTTP to HTTPS redirect
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeURLMap
metadata:
  name: app-http-redirect
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  defaultUrlRedirect:
    httpsRedirect: true
    redirectResponseCode: MOVED_PERMANENTLY_DEFAULT
    stripQuery: false
```

**Explanation:** The HTTP-to-HTTPS redirect URL map (Step 6) is attached to a separate `ComputeTargetHTTPProxy` and forwarding rule on port 80, ensuring all HTTP traffic is permanently redirected to HTTPS. This separation is necessary because the same URL map cannot serve both redirect and proxy behavior simultaneously. Together, Examples 27 and 28 constitute the complete six-resource global HTTPS LB stack deployable via `kubectl apply -f lb-stack/`.

---

### Example 29: KCC VPC + Terraform GKE Cluster Referencing KCC Network
**Concept:** Terraform can reference GCP resources created by KCC by using data sources that look up the resource by its GCP name, enabling hybrid IaC workflows.

```hcl
# terraform/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "my-gcp-project"
  region  = "us-central1"
}

# Reference the VPC created by KCC ComputeNetwork "gke-vpc"
data "google_compute_network" "gke_vpc" {
  name    = "gke-vpc"
  project = "my-gcp-project"
}

# Reference the subnet created by KCC ComputeSubnetwork "gke-nodes-subnet"
data "google_compute_subnetwork" "gke_nodes_subnet" {
  name    = "gke-nodes-subnet"
  region  = "us-central1"
  project = "my-gcp-project"
}

resource "google_container_cluster" "my_gke_cluster" {
  name     = "my-gke-cluster"
  location = "us-central1"

  network    = data.google_compute_network.gke_vpc.self_link
  subnetwork = data.google_compute_subnetwork.gke_nodes_subnet.self_link

  remove_default_node_pool = true
  initial_node_count       = 1

  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  workload_identity_config {
    workload_pool = "my-gcp-project.svc.id.goog"
  }
}
```

**Explanation:** The `data "google_compute_network"` block reads the network that KCC created, providing its `self_link` to the GKE cluster resource without duplicating the network definition in Terraform. This pattern is clean for teams where the platform team manages networking via KCC and the application team provisions GKE via Terraform. The secondary range names `gke-pods` and `gke-services` must exactly match the `rangeName` values defined in the KCC `ComputeSubnetwork` spec.

---

### Example 30: Terraform GKE Node Pool with KCC-managed Firewall Tags
**Concept:** Terraform node pools can be configured with network tags that correspond to KCC-managed firewall rules, keeping tag-to-firewall associations consistent across both IaC tools.

```hcl
resource "google_container_node_pool" "primary_nodes" {
  name       = "primary-node-pool"
  location   = "us-central1"
  cluster    = google_container_cluster.my_gke_cluster.name
  node_count = 3

  node_config {
    machine_type = "e2-standard-4"
    disk_size_gb = 100
    disk_type    = "pd-ssd"

    # Tags must match KCC ComputeFirewall targetTags
    tags = [
      "gke-my-gke-cluster",
      "gke-my-gke-cluster-default-pool"
    ]

    service_account = "gke-node-sa@my-gcp-project.iam.gserviceaccount.com"
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]

    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }

  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }
}
```

**Explanation:** The `tags` list must be kept in sync with the `targetTags` values in all KCC `ComputeFirewall` resources that target GKE nodes. A comment referencing the specific KCC firewall resource names makes this dependency explicit for future maintainers. `GKE_METADATA` workload metadata mode is required for Workload Identity to function correctly, and `enable_secure_boot` hardens nodes against bootkit attacks.

---

### Example 31: Kubernetes NetworkPolicy + KCC ComputeFirewall — Defense in Depth
**Concept:** Combining Kubernetes `NetworkPolicy` (enforced by the CNI plugin at the pod level) with KCC `ComputeFirewall` (enforced at the VPC level) creates two independent security layers for GKE workload isolation.

```yaml
# Kubernetes NetworkPolicy — L4 pod-to-pod isolation (CNI enforced)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
---
# KCC ComputeFirewall — VPC-level enforcement (GCP enforced)
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-node-port-8080
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: gke-vpc
  direction: INGRESS
  priority: 1000
  allow:
    - protocol: tcp
      ports:
        - "8080"
  sourceTags:
    - gke-my-gke-cluster
  targetTags:
    - gke-my-gke-cluster
  description: "Allow intra-cluster traffic on port 8080 for backend service"
```

**Explanation:** `NetworkPolicy` operates at the pod identity level (using label selectors) and is enforced by the CNI plugin (e.g., Calico, Cilium, or GKE Dataplane V2). `ComputeFirewall` operates at the VM/IP level and is enforced by the GCP hypervisor before packets reach the node. An attacker who bypasses the CNI plugin (e.g., via a kernel exploit) would still be stopped by the VPC firewall. This defense-in-depth strategy is recommended by the GKE Security Hardening Guide.

---

### Example 32: DNS + Cert Provisioning for Helm-Deployed App
**Concept:** A Helm chart can template KCC DNS and certificate resources alongside Kubernetes Deployments, making domain provisioning part of the application release process.

```yaml
# helm/templates/dns-cert.yaml
{{- if .Values.networking.enabled }}
apiVersion: dns.cnrm.cloud.google.com/v1beta1
kind: DNSRecordSet
metadata:
  name: {{ .Release.Name }}-dns-record
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.gcp.projectId }}
  labels:
    helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
    app.kubernetes.io/managed-by: {{ .Release.Service }}
spec:
  managedZoneRef:
    name: {{ .Values.networking.dnsZoneName }}
  name: "{{ .Values.networking.hostname }}."
  type: A
  ttl: {{ .Values.networking.dnsTtl | default 300 }}
  rrdatas:
    - {{ .Values.networking.loadBalancerIp }}
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSSLCertificate
metadata:
  name: {{ .Release.Name }}-cert
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.gcp.projectId }}
  labels:
    helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
spec:
  managed:
    domains:
      - {{ .Values.networking.hostname }}
{{- end }}
```

**Explanation:** Placing KCC resources in Helm templates allows `helm upgrade` to create, update, or delete DNS records and certificates alongside the application workload. The `config-connector` namespace is hardcoded because KCC resources must live in the namespace where the KCC controller watches, while the application resources live in their own namespaces. `helm.sh/chart` and `app.kubernetes.io/managed-by` labels enable `helm list` and `helm uninstall` to track KCC resources correctly.

---

### Example 33: Helm values.yaml for KCC Networking Integration
**Concept:** Centralizing all KCC networking parameters in `values.yaml` makes the networking configuration visible, overridable, and auditable across environments.

```yaml
# helm/values.yaml
gcp:
  projectId: my-gcp-project
  region: us-central1

networking:
  enabled: true
  vpcName: gke-vpc
  subnetName: gke-nodes-subnet
  dnsZoneName: my-gcp-project-zone
  hostname: app.my-gcp-project.example.com
  loadBalancerIp: "34.120.50.100"
  dnsTtl: 300
  firewallPriority: 1000
  enableFlowLogs: true

ingress:
  enabled: true
  className: gce
  annotations:
    kubernetes.io/ingress.global-static-ip-name: gke-global-lb-ip
    networking.gke.io/managed-cert: app-managed-cert
    kubernetes.io/ingress.allow-http: "false"
  hosts:
    - host: app.my-gcp-project.example.com
      paths:
        - path: /
          pathType: Prefix

# Override for production
# helm upgrade my-app ./chart --set networking.hostname=prod.my-gcp-project.example.com
```

**Explanation:** Separating `gcp.projectId` from networking parameters allows the same chart to deploy to multiple GCP projects by overriding `--set gcp.projectId=other-project`. The `ingress.annotations` section demonstrates the GKE-specific annotations that link a Kubernetes Ingress to the KCC-managed static IP and managed certificate, creating a tight integration between the K8s Ingress controller and KCC-provisioned GCP resources. Environment-specific overrides can be stored in `values-production.yaml` files.

---

### Example 34: Helm Hook — Wait for KCC Certificate to Become Active
**Concept:** A Helm post-install hook that waits for the KCC-managed SSL certificate to reach `ACTIVE` status prevents application traffic from failing TLS handshakes during initial deployment.

```yaml
# helm/templates/cert-ready-hook.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-cert-ready-check
  namespace: {{ .Release.Namespace }}
  annotations:
    "helm.sh/hook": post-install,post-upgrade
    "helm.sh/hook-weight": "5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  backoffLimit: 30
  template:
    spec:
      restartPolicy: OnFailure
      serviceAccountName: kcc-reader-sa
      containers:
        - name: cert-checker
          image: bitnami/kubectl:1.28
          command:
            - /bin/sh
            - -c
            - |
              echo "Waiting for SSL certificate to become active..."
              until kubectl get computesslcertificate {{ .Release.Name }}-cert \
                -n config-connector \
                -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' \
                | grep -q "True"; do
                echo "Certificate not ready yet, waiting 30s..."
                sleep 30
              done
              echo "Certificate is active!"
```

**Explanation:** The `post-install` hook runs after all chart resources are created, giving KCC time to provision the certificate. The `backoffLimit: 30` with 30-second sleeps provides up to 15 minutes of wait time, which is sufficient for Google-managed certificate provisioning (typically 5–10 minutes after DNS propagates). `hook-delete-policy: before-hook-creation` ensures the Job is cleaned up before the next upgrade, preventing accumulation of stale Job objects.

---

### Example 35: KCC ComputeNetwork + NetworkPolicy — Namespace Isolation Pattern
**Concept:** Combining VPC-level firewall rules with namespace-scoped Kubernetes NetworkPolicies establishes a multi-tenancy isolation pattern where each team's namespace has independent network controls.

```yaml
# Default deny all ingress/egress for team-a namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: team-a
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
# Allow team-a pods to reach the KCC-managed backend service
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-team-a-egress-to-api
  namespace: team-a
spec:
  podSelector:
    matchLabels:
      role: api-client
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: team-b
          podSelector:
            matchLabels:
              role: api-server
      ports:
        - protocol: TCP
          port: 8080
    - to:
        - ipBlock:
            cidr: "199.36.153.4/30"
      ports:
        - protocol: TCP
          port: 443
```

**Explanation:** The default-deny policy with an empty `podSelector: {}` applies to all pods in the namespace — both ingress and egress are blocked by default. The egress allowance for `199.36.153.4/30` (Private Google Access VIP) must be explicitly permitted because the default-deny blocks all outbound traffic, including calls to Google APIs. The VPC-level firewall (managed by KCC) provides the second enforcement layer, ensuring that even if a NetworkPolicy is accidentally deleted, node-level controls remain in effect.

---

### Example 36: DNS Provisioning Pipeline — External-DNS + KCC Zone
**Concept:** External-DNS can be configured to write `DNSRecordSet` KCC resources instead of calling the Cloud DNS API directly, making all DNS changes auditable in the GitOps repository.

```yaml
# External-DNS Helm values for KCC provider
# helm install external-dns bitnami/external-dns -f external-dns-values.yaml
provider: google
google:
  project: my-gcp-project
  zoneVisibility: public

# Use CRD source to read DNSEndpoint objects created by Helm
sources:
  - service
  - ingress
  - crd

# Filter to only manage records in this zone
domainFilters:
  - my-gcp-project.example.com

# KCC annotation to place records in the right zone
annotationFilter: "external-dns.alpha.kubernetes.io/hostname"

# Sync policy
policy: sync
interval: 1m

# RBAC
rbac:
  create: true
  serviceAccountName: external-dns

serviceAccount:
  annotations:
    iam.gke.io/gcp-service-account: external-dns-sa@my-gcp-project.iam.gserviceaccount.com
```

**Explanation:** The `iam.gke.io/gcp-service-account` annotation enables Workload Identity for the External-DNS pod, allowing it to authenticate to Cloud DNS using a GCP service account without storing credentials as Kubernetes secrets. External-DNS with the `sync` policy will delete DNS records for services/ingresses that no longer exist, keeping DNS in sync with the cluster state. The `domainFilters` setting prevents External-DNS from accidentally managing records in other DNS zones.

---

### Example 37: KCC Firewall + Helm ConfigMap — Dynamic Port Configuration
**Concept:** Helm can render KCC firewall resources with port numbers sourced from application configuration, ensuring firewall rules automatically track changes to application service ports.

```yaml
# helm/templates/app-firewall.yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeFirewall
metadata:
  name: allow-{{ .Release.Name }}-ingress
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: {{ .Values.gcp.projectId }}
spec:
  networkRef:
    name: {{ .Values.networking.vpcName }}
  direction: INGRESS
  priority: {{ .Values.networking.firewallPriority }}
  allow:
    - protocol: tcp
      ports:
        {{- range .Values.service.ports }}
        - {{ .port | quote }}
        {{- end }}
  targetTags:
    - gke-{{ .Values.clusterName }}
  sourceRanges:
    {{- range .Values.networking.allowedCidrs }}
    - {{ . }}
    {{- end }}
  description: "Auto-generated firewall for {{ .Release.Name }} (Helm managed)"
  logConfig:
    metadata: INCLUDE_ALL_METADATA
```

**Explanation:** Using Helm's `range` action to iterate over `.Values.service.ports` ensures the firewall rule always reflects the ports defined in the application's service specification. When a developer adds a new port to `values.yaml`, the next `helm upgrade` will update both the Kubernetes Service and the KCC ComputeFirewall atomically. The `description` field embeds the Helm release name, making it easy to trace which application owns each GCP firewall rule in the GCP Console.

---

### Example 38: Full Stack Composition — KCC Networking + Terraform GKE + Helm App
**Concept:** A GitOps repository structure that separates KCC networking resources, Terraform cluster provisioning, and Helm application deployment into distinct layers with explicit dependency ordering.

```bash
# Repository structure
# infra/
#   kcc/networking/          <- Applied first via ArgoCD App-of-Apps
#     vpc.yaml
#     subnets.yaml
#     firewalls.yaml
#     router.yaml
#     nat.yaml
#   terraform/gke/           <- Applied second via Terraform Cloud
#     main.tf                # References KCC-created network via data sources
#     node-pools.tf
#     outputs.tf
#   helm/apps/               <- Applied third via ArgoCD ApplicationSet
#     my-app/
#       Chart.yaml
#       values.yaml
#       templates/
#         deployment.yaml
#         service.yaml
#         dns-cert.yaml      # KCC DNSRecordSet + ComputeSSLCertificate

# Deployment order script
#!/bin/bash
set -euo pipefail

echo "==> Phase 1: Apply KCC networking resources"
kubectl apply -f infra/kcc/networking/ -n config-connector
kubectl wait computenetwork/gke-vpc --for=condition=Ready --timeout=60s -n config-connector
kubectl wait computesubnetwork/gke-nodes-subnet --for=condition=Ready --timeout=60s -n config-connector
kubectl wait computerouter/gke-router --for=condition=Ready --timeout=60s -n config-connector
kubectl wait computerouternat/gke-nat --for=condition=Ready --timeout=120s -n config-connector

echo "==> Phase 2: Provision GKE cluster via Terraform"
cd infra/terraform/gke
terraform init -backend-config=backend.hcl
terraform apply -auto-approve

echo "==> Phase 3: Deploy application via Helm"
gcloud container clusters get-credentials my-gke-cluster \
  --region us-central1 --project my-gcp-project
helm upgrade --install my-app infra/helm/apps/my-app \
  --namespace production --create-namespace \
  --values infra/helm/apps/my-app/values.yaml \
  --wait --timeout 10m
```

**Explanation:** The three-phase ordering is critical: networking must exist before GKE (which references subnet names), and GKE must exist before Helm (which deploys to the cluster). The `kubectl wait` commands between phases act as synchronization barriers, ensuring KCC has fully reconciled all GCP resources before Terraform runs. This pattern is the foundation of a GitOps platform where ArgoCD manages KCC and Helm layers while Terraform Cloud manages cluster lifecycle.

---

## ADVANCED (Examples 39–50)

### Example 39: Shared VPC — Host Project Network Configuration
**Concept:** Shared VPC allows a host project to own the network resources while multiple service projects attach their GKE clusters and workloads to the shared subnets, centralizing network governance.

```yaml
# In the host project's config-connector namespace
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSharedVPCHostProject
metadata:
  name: shared-vpc-host
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  resourceID: my-gcp-project
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: shared-gke-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: "10.10.0.0/20"
  networkRef:
    name: gke-vpc
  privateIpGoogleAccess: true
  secondaryIpRanges:
    - rangeName: shared-gke-pods
      ipCidrRange: "10.20.0.0/14"
    - rangeName: shared-gke-services
      ipCidrRange: "10.24.0.0/20"
  logConfig:
    aggregationInterval: INTERVAL_5_SEC
    flowSampling: 1.0
    metadata: INCLUDE_ALL_METADATA
```

**Explanation:** `ComputeSharedVPCHostProject` activates Shared VPC mode for the project, which is a one-time operation that cannot be reversed without removing all service project attachments. Service projects are attached using `ComputeSharedVPCServiceProject` resources (in the host project), after which GKE clusters in service projects can specify the shared subnet's `self_link` in their IP allocation policy. All firewall rules, Cloud NAT, and Cloud Router resources are managed in the host project via KCC.

---

### Example 40: Shared VPC — Service Project Attachment
**Concept:** `ComputeSharedVPCServiceProject` attaches a service project to the Shared VPC host project, granting it permission to use subnets from the host project's network.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSharedVPCServiceProject
metadata:
  name: gke-service-project-attachment
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  serviceProjectRef:
    external: projects/gke-workloads-project
```

**Explanation:** This resource is created in the host project's KCC context and establishes the Shared VPC relationship. After this resource becomes `Ready`, GKE clusters in `gke-workloads-project` can reference subnets in `my-gcp-project` via their full `self_link`. IAM bindings for the GKE service account in the service project (`container.serviceAgent`) must also be granted `compute.networkUser` on the shared subnets — this is typically managed alongside the attachment in the same KCC IAM resources.

---

### Example 41: Private Service Connect — Publish a GKE Service Internally
**Concept:** Private Service Connect (PSC) allows a GKE-hosted service to be published as a GCP-managed private endpoint accessible from consumer VPCs without VPC peering or exposing the underlying infrastructure.

```yaml
# Producer side: Service Attachment (in producer project)
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeServiceAttachment
metadata:
  name: my-app-psc-attachment
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  connectionPreference: ACCEPT_AUTOMATIC
  natSubnets:
    - subnetworkRef:
        name: psc-nat-subnet
  targetServiceRef:
    name: gke-internal-forwarding-rule
  description: "PSC attachment for my-app internal load balancer"
  enableProxyProtocol: false
---
# PSC NAT subnet (required for PSC)
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSubnetwork
metadata:
  name: psc-nat-subnet
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  ipCidrRange: "10.50.0.0/28"
  networkRef:
    name: gke-vpc
  purpose: PRIVATE_SERVICE_CONNECT
  description: "NAT subnet for Private Service Connect"
```

**Explanation:** PSC requires a dedicated NAT subnet with `purpose: PRIVATE_SERVICE_CONNECT` — this subnet is used only for SNAT of consumer-side traffic and is not available for VM or pod IPs. `ACCEPT_AUTOMATIC` automatically approves all consumer connection requests; use `ACCEPT_MANUAL` with an explicit `consumerAcceptList` for production environments requiring access control. The `targetServiceRef` points to an internal forwarding rule, making the GKE service's internal load balancer the PSC endpoint.

---

### Example 42: ComputeRoute — Custom Static Route
**Concept:** `ComputeRoute` creates a custom static route in a VPC that directs traffic destined for a specific CIDR to a next-hop gateway, VM, or tunnel.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeRoute
metadata:
  name: route-to-on-prem
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  networkRef:
    name: gke-vpc
  destRange: "192.168.100.0/24"
  priority: 1000
  nextHopGateway: "projects/my-gcp-project/global/gateways/default-internet-gateway"
  tags:
    - gke-my-gke-cluster
  description: "Route on-prem CIDR through internet gateway for testing"
```

**Explanation:** Static routes with `tags` are only applied to instances with matching network tags, allowing selective routing policies per node pool. For production on-premises connectivity, the `nextHopGateway` would point to a VPN tunnel or Interconnect attachment rather than the internet gateway. Custom routes with lower priority numbers take precedence over the default internet route (`0.0.0.0/0` at priority 1000), enabling traffic steering for specific CIDR ranges without affecting other traffic.

---

### Example 43: ComputeVPNGateway + ComputeVPNTunnel — HA VPN to On-Premises
**Concept:** High-Availability VPN uses two VPN gateways and four tunnels (two per gateway) to provide 99.99% uptime SLA for site-to-site connectivity between GCP and on-premises networks.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeVPNGateway
metadata:
  name: gke-ha-vpn-gateway
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  networkRef:
    name: gke-vpc
  description: "HA VPN gateway for GKE cluster connectivity to on-prem"
  stackType: IPV4_ONLY
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeExternalVPNGateway
metadata:
  name: on-prem-vpn-gateway
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  redundancyType: TWO_IPS_REDUNDANCY
  interface:
    - id: 0
      ipAddress: "203.0.113.1"
    - id: 1
      ipAddress: "203.0.113.2"
  description: "On-premises VPN gateway with two IPs for HA"
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeVPNTunnel
metadata:
  name: gke-vpn-tunnel-0
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  region: us-central1
  vpnGatewayRef:
    name: gke-ha-vpn-gateway
  vpnGatewayInterface: 0
  peerExternalGatewayRef:
    name: on-prem-vpn-gateway
  peerExternalGatewayInterface: 0
  sharedSecretRef:
    name: vpn-shared-secret
    key: psk
  ikeVersion: 2
  routerRef:
    name: gke-router
  description: "HA VPN tunnel 0 - gateway interface 0 to on-prem interface 0"
```

**Explanation:** HA VPN requires two tunnels per gateway interface pair — this example shows one tunnel (`gke-vpn-tunnel-0`); a second (`gke-vpn-tunnel-1`) would use `vpnGatewayInterface: 1` and `peerExternalGatewayInterface: 1`. The `sharedSecretRef` pulls the pre-shared key from a Kubernetes Secret, keeping credentials out of KCC manifests. IKEv2 is preferred over IKEv1 for stronger authentication and faster rekeying.

---

### Example 44: ComputeSecurityPolicy — Cloud Armor WAF Rules
**Concept:** `ComputeSecurityPolicy` creates a Cloud Armor security policy with Web Application Firewall (WAF) rules that inspect and filter HTTP requests before they reach GKE backends.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeSecurityPolicy
metadata:
  name: gke-cloud-armor-policy
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  description: "Cloud Armor WAF policy for GKE application load balancer"
  type: CLOUD_ARMOR
  rule:
    - priority: 1000
      action: allow
      match:
        versionedExpr: SRC_IPS_V1
        config:
          srcIpRanges:
            - "10.0.0.0/8"
            - "172.16.0.0/12"
    - priority: 2000
      action: deny(403)
      match:
        expr:
          expression: "evaluatePreconfiguredExpr('sqli-v33-stable')"
      description: "Block SQL injection attacks"
    - priority: 3000
      action: deny(403)
      match:
        expr:
          expression: "evaluatePreconfiguredExpr('xss-v33-stable')"
      description: "Block Cross-Site Scripting attacks"
    - priority: 4000
      action: throttle
      match:
        versionedExpr: SRC_IPS_V1
        config:
          srcIpRanges:
            - "0.0.0.0/0"
      rateLimitOptions:
        rateLimitThreshold:
          count: 100
          intervalSec: 60
        conformAction: allow
        exceedAction: deny(429)
      description: "Rate limit to 100 requests per minute per IP"
    - priority: 2147483647
      action: allow
      match:
        versionedExpr: SRC_IPS_V1
        config:
          srcIpRanges:
            - "0.0.0.0/0"
      description: "Default allow rule"
```

**Explanation:** Cloud Armor rules are evaluated in ascending priority order (lower number = higher priority), so the RFC-1918 allow rule at priority 1000 permits internal traffic before WAF rules run. The `evaluatePreconfiguredExpr` functions apply Google-maintained OWASP ModSecurity rule sets, updated by Google without requiring policy changes. Rate limiting at priority 4000 applies to all public IPs and returns HTTP 429 when exceeded, protecting GKE services from volumetric abuse.

---

### Example 45: Attach Cloud Armor to Backend Service
**Concept:** A Cloud Armor security policy is attached to a `ComputeBackendService` resource, enforcing WAF rules on all traffic routed to that backend before it reaches GKE pods.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeBackendService
metadata:
  name: gke-protected-backend
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  loadBalancingScheme: EXTERNAL_MANAGED
  protocol: HTTP
  port: 8080
  portName: http
  timeoutSec: 30
  healthChecks:
    - healthCheckRef:
        name: gke-http-health-check
  securityPolicy:
    securityPolicyRef:
      name: gke-cloud-armor-policy
  backend:
    - group: "projects/my-gcp-project/zones/us-central1-a/networkEndpointGroups/my-gke-cluster-neg"
      balancingMode: RATE
      maxRatePerEndpoint: 100
  logConfig:
    enable: true
    sampleRate: 1.0
  connectionDraining:
    drainingTimeoutSec: 60
```

**Explanation:** The `securityPolicyRef` field links the Cloud Armor policy to this backend service — all requests passing through the load balancer to this backend are inspected against the WAF rules before being forwarded. Cloud Armor operates at the Google network edge (before traffic enters the VPC), providing early-stage filtering that reduces load on GKE nodes. A single security policy can be referenced by multiple backend services, enabling consistent WAF rules across all services.

---

### Example 46: Traffic Director — Service Mesh Routing via KCC
**Concept:** Traffic Director is GCP's managed control plane for service mesh traffic management, and `ComputeHttpRoute` resources configure advanced L7 routing rules for Envoy sidecar proxies in GKE.

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeBackendService
metadata:
  name: td-backend-v1
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  loadBalancingScheme: INTERNAL_SELF_MANAGED
  protocol: HTTP
  port: 8080
  healthChecks:
    - healthCheckRef:
        name: gke-http-health-check
  backend:
    - group: "projects/my-gcp-project/zones/us-central1-a/networkEndpointGroups/td-neg-v1"
      balancingMode: UTILIZATION
      maxUtilization: 0.8
  trafficControl:
    outlierDetection:
      consecutiveErrors: 5
      interval:
        seconds: 10
      baseEjectionTime:
        seconds: 30
      maxEjectionPercent: 50
---
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeURLMap
metadata:
  name: td-url-map
  namespace: config-connector
  annotations:
    cnrm.cloud.google.com/project-id: my-gcp-project
spec:
  defaultService:
    backendServiceRef:
      name: td-backend-v1
  hostRule:
    - hosts:
        - "my-app.my-gcp-project.example.com"
      pathMatcher: td-matcher
  pathMatcher:
    - name: td-matcher
      defaultService:
        backendServiceRef:
          name: td-backend-v1
      routeRules:
        - priority: 1
          matchRules:
            - headerMatches:
                - headerName: x-version
                  exactMatch: v2
          service:
            backendServiceRef:
              name: td-backend-v2
          routeAction:
            weightedBackendServices:
              - backendServiceRef:
                  name: td-backend-v2
                weight: 100
```

**Explanation:** Traffic Director with `INTERNAL_SELF_MANAGED` load balancing scheme distributes xDS configuration to Envoy proxies in GKE pods, enabling zero-downtime canary deployments through header-based routing. The `outlierDetection` configuration on the backend service implements circuit-breaking, automatically ejecting unhealthy endpoints from the load balancing pool. This pattern enables progressive delivery without a separate service mesh product like Istio.

---

### Example 47: NEG Integration — Standalone Zonal NEG for GKE Pods
**Concept:** Network Endpoint Groups (NEGs) are created automatically by GKE when a Service has the `neg` annotation, and they can be referenced by KCC backend services for container-native load balancing.

```yaml
# Kubernetes Service with NEG annotation (triggers automatic NEG creation)
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
  namespace: production
  annotations:
    cloud.google.com/neg: '{"ingress": true, "exposed_ports": {"8080": {"name": "my-app-neg"}}}'
    cloud.google.com/backend-config: '{"default": "my-app-backend-config"}'
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
    - name: http
      port: 8080
      targetPort: 8080
---
# BackendConfig for advanced backend configuration
apiVersion: cloud.google.com/v1
kind: BackendConfig
metadata:
  name: my-app-backend-config
  namespace: production
spec:
  healthCheck:
    checkIntervalSec: 15
    timeoutSec: 10
    healthyThreshold: 1
    unhealthyThreshold: 2
    type: HTTP
    requestPath: /healthz
    port: 8080
  connectionDraining:
    drainingTimeoutSec: 60
  securityPolicy:
    name: gke-cloud-armor-policy
  logging:
    enable: true
    sampleRate: 1.0
```

**Explanation:** The `cloud.google.com/neg` annotation instructs GKE to create a NEG named `my-app-neg` in each zone of the cluster, automatically populating it with pod IP:port endpoints as pods are scheduled or terminated. The `BackendConfig` resource (a GKE-specific CRD) provides backend-level settings that are not available in the Kubernetes Ingress spec, and it's referenced from the Service via the `cloud.google.com/backend-config` annotation. Together, these annotations integrate directly with KCC-managed `ComputeBackendService` resources.

---

### Example 48: GitOps Pipeline — ArgoCD ApplicationSet for KCC Networking
**Concept:** An ArgoCD `ApplicationSet` can deploy KCC networking resources across multiple clusters or environments from a single GitOps repository, with per-environment parameter overrides.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: kcc-networking
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - env: production
            project: my-gcp-project
            region: us-central1
            vpcCidr: "10.0.0.0/20"
            podCidr: "10.4.0.0/14"
            servicesCidr: "10.8.0.0/20"
          - env: staging
            project: my-gcp-project
            region: us-central1
            vpcCidr: "10.100.0.0/20"
            podCidr: "10.104.0.0/14"
            servicesCidr: "10.108.0.0/20"
  template:
    metadata:
      name: "kcc-networking-{{env}}"
      namespace: argocd
    spec:
      project: platform
      source:
        repoURL: https://github.com/my-org/infra-repo
        targetRevision: HEAD
        path: "kcc/networking/{{env}}"
        helm:
          valueFiles:
            - "values-{{env}}.yaml"
          parameters:
            - name: gcp.projectId
              value: "{{project}}"
            - name: networking.region
              value: "{{region}}"
      destination:
        server: "https://kubernetes.default.svc"
        namespace: config-connector
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
          - ApplyOutOfSyncOnly=true
          - RespectIgnoreDifferences=true
```

**Explanation:** The `list` generator creates one ArgoCD Application per environment, each pointing to an environment-specific path in the GitOps repository with different CIDR allocations to prevent overlap. `selfHeal: true` automatically reconciles manual GCP changes back to the desired state in Git, enforcing GitOps as the single source of truth. `RespectIgnoreDifferences` allows KCC-controlled fields (like `.status`) to differ from the manifest without triggering a sync.

---

### Example 49: Terraform Networking Module — Wrapping KCC Resources
**Concept:** A Terraform null resource can trigger `kubectl apply` of KCC networking manifests as part of a Terraform workflow, enabling teams that use Terraform exclusively to still leverage KCC's Kubernetes-native networking management.

```hcl
# terraform/modules/kcc-networking/main.tf
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

locals {
  kcc_namespace = "config-connector"
}

# Render KCC network manifest from template
resource "local_file" "vpc_manifest" {
  content = templatefile("${path.module}/templates/vpc.yaml.tpl", {
    project_id   = var.project_id
    network_name = var.network_name
    routing_mode = var.routing_mode
  })
  filename = "${path.module}/rendered/vpc.yaml"
}

# Apply KCC manifest via kubernetes provider
resource "kubernetes_manifest" "vpc" {
  manifest = yamldecode(local_file.vpc_manifest.content)

  wait {
    fields = {
      "status.conditions[0].type"   = "Ready"
      "status.conditions[0].status" = "True"
    }
  }

  timeouts {
    create = "5m"
    update = "5m"
  }
}

resource "kubernetes_manifest" "subnet" {
  depends_on = [kubernetes_manifest.vpc]

  manifest = {
    apiVersion = "compute.cnrm.cloud.google.com/v1beta1"
    kind       = "ComputeSubnetwork"
    metadata = {
      name      = var.subnet_name
      namespace = local.kcc_namespace
      annotations = {
        "cnrm.cloud.google.com/project-id" = var.project_id
      }
    }
    spec = {
      region        = var.region
      ipCidrRange   = var.subnet_cidr
      networkRef    = { name = var.network_name }
      privateIpGoogleAccess = true
      secondaryIpRanges = [
        { rangeName = "gke-pods",     ipCidrRange = var.pods_cidr     },
        { rangeName = "gke-services", ipCidrRange = var.services_cidr }
      ]
    }
  }
}
```

**Explanation:** The `kubernetes_manifest` resource with `wait.fields` blocks Terraform until the KCC resource's `Ready` condition becomes `True`, providing the same synchronization guarantee as `kubectl wait`. Using `depends_on` between subnet and VPC manifest resources enforces creation order within Terraform's dependency graph. This hybrid approach lets teams gradually migrate from Terraform-only to KCC-first networking without rewriting all infrastructure code at once.

---

### Example 50: Full Advanced Networking Stack — Terraform Output + KCC Ingress + GitOps Health Check
**Concept:** A complete end-to-end example combining Terraform outputs, KCC-managed load balancer configuration, and a GitOps health verification script demonstrates a production-ready deployment pipeline for GKE networking.

```bash
#!/bin/bash
# scripts/verify-networking-stack.sh
# Full stack verification: Terraform -> KCC -> DNS -> TLS -> Application
set -euo pipefail

PROJECT_ID="my-gcp-project"
CLUSTER_NAME="my-gke-cluster"
REGION="us-central1"
NAMESPACE="config-connector"
APP_HOSTNAME="app.my-gcp-project.example.com"

echo "==> [1/7] Verifying Terraform GKE cluster state"
cd infra/terraform/gke
terraform output -json | jq '{
  cluster_endpoint: .cluster_endpoint.value,
  cluster_ca: .cluster_ca_certificate.value
}'

echo "==> [2/7] Fetching GKE credentials"
gcloud container clusters get-credentials "$CLUSTER_NAME" \
  --region "$REGION" \
  --project "$PROJECT_ID"

echo "==> [3/7] Verifying all KCC networking resources are Ready"
RESOURCES=(
  "computenetwork/gke-vpc"
  "computesubnetwork/gke-nodes-subnet"
  "computefirewall/allow-gke-internal"
  "computerouter/gke-router"
  "computerouternat/gke-nat"
  "computeglobaladdress/gke-global-lb-ip"
  "computesslcertificate/gke-managed-cert"
  "computeurlmap/gke-url-map"
  "computetargethttpsproxy/gke-https-proxy"
  "computeforwardingrule/gke-global-https-forwarding-rule"
)
for resource in "${RESOURCES[@]}"; do
  echo -n "  Checking $resource ... "
  status=$(kubectl get "$resource" -n "$NAMESPACE" \
    -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
  if [[ "$status" == "True" ]]; then
    echo "READY"
  else
    echo "NOT READY (status: $status)"
    kubectl describe "$resource" -n "$NAMESPACE" | tail -20
    exit 1
  fi
done

echo "==> [4/7] Verifying Cloud Armor policy is attached"
gcloud compute backend-services describe gke-protected-backend \
  --global \
  --project "$PROJECT_ID" \
  --format="value(securityPolicy)"

echo "==> [5/7] Checking DNS resolution"
RESOLVED_IP=$(dig +short "$APP_HOSTNAME" A | head -1)
EXPECTED_IP=$(kubectl get computeglobaladdress gke-global-lb-ip \
  -n "$NAMESPACE" -o jsonpath='{.status.address}')
if [[ "$RESOLVED_IP" == "$EXPECTED_IP" ]]; then
  echo "  DNS resolves correctly: $APP_HOSTNAME -> $RESOLVED_IP"
else
  echo "  DNS mismatch: expected $EXPECTED_IP, got $RESOLVED_IP"
  exit 1
fi

echo "==> [6/7] Verifying TLS certificate is ACTIVE"
CERT_STATUS=$(gcloud compute ssl-certificates describe gke-managed-cert \
  --global \
  --project "$PROJECT_ID" \
  --format="value(managed.status)")
echo "  Certificate status: $CERT_STATUS"
if [[ "$CERT_STATUS" != "ACTIVE" ]]; then
  echo "  Certificate is not yet active. Domain management status:"
  gcloud compute ssl-certificates describe gke-managed-cert \
    --global --project "$PROJECT_ID" \
    --format="json" | jq '.managed.domainStatus'
  exit 1
fi

echo "==> [7/7] End-to-end HTTPS connectivity test"
HTTP_STATUS=$(curl -sS -o /dev/null -w "%{http_code}" \
  --max-time 10 \
  "https://$APP_HOSTNAME/healthz")
if [[ "$HTTP_STATUS" == "200" ]]; then
  echo "  HTTPS health check passed: HTTP $HTTP_STATUS"
else
  echo "  HTTPS health check failed: HTTP $HTTP_STATUS"
  exit 1
fi

echo ""
echo "All networking stack verifications passed."
```

**Explanation:** This verification script is designed to run as a CI/CD post-deployment step or a Helm post-install hook, providing a single command that validates every layer of the networking stack from Terraform outputs through KCC resource readiness, DNS propagation, TLS certificate activation, and final HTTPS end-to-end connectivity. The script exits non-zero at the first failure, making it suitable as a quality gate in GitOps pipelines using ArgoCD sync waves or GitHub Actions deployment environments. Running this script after every `helm upgrade` or KCC manifest push gives confidence that the full networking stack is operational before marking a release as successful.
