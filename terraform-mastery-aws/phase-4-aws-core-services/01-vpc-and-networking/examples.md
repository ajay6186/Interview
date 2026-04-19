# Examples 4.1 — VPC & Networking (50 examples)

---

## Basic

### 1. Create a VPC
```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = { Name = "main-vpc" }
}
```

### 2. Create a public subnet
```hcl
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  tags = { Name = "public-subnet" }
}
```

### 3. Create a private subnet
```hcl
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1a"
  tags = { Name = "private-subnet" }
}
```

### 4. Internet Gateway
```hcl
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "main-igw" }
}
```

### 5. Public route table
```hcl
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "public-rt" }
}
```

### 6. Route table association
```hcl
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
```

### 7. Security group — basic SSH
```hcl
resource "aws_security_group" "ssh" {
  name   = "allow-ssh"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 8. Elastic IP for NAT Gateway
```hcl
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "nat-eip" }
}
```

### 9. NAT Gateway
```hcl
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id
  tags          = { Name = "main-nat" }
  depends_on    = [aws_internet_gateway.igw]
}
```

### 10. Private route table using NAT
```hcl
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = { Name = "private-rt" }
}
```

### 11. Enable DNS hostnames and support
```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
}
```

### 12. Data source for available AZs
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
}
```

---

## Intermediate

### 13. VPC with multiple public/private subnets across AZs
```hcl
locals {
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_cidrs    = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_cidrs   = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = true
  tags = { Name = "public-${local.azs[count.index]}" }
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_cidrs[count.index]
  availability_zone = local.azs[count.index]
  tags = { Name = "private-${local.azs[count.index]}" }
}
```

### 14. Security group with self-reference
```hcl
resource "aws_security_group" "app" {
  name   = "app-sg"
  vpc_id = aws_vpc.main.id

  ingress {
    from_port = 8080
    to_port   = 8080
    protocol  = "tcp"
    self      = true
  }
}
```

### 15. Security group referencing another SG
```hcl
resource "aws_security_group" "alb" {
  name   = "alb-sg"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "app" {
  name   = "app-sg"
  vpc_id = aws_vpc.main.id
  ingress {
    from_port                = 8080
    to_port                  = 8080
    protocol                 = "tcp"
    source_security_group_id = aws_security_group.alb.id
  }
}
```

### 16. VPC Peering connection
```hcl
resource "aws_vpc_peering_connection" "peer" {
  vpc_id      = aws_vpc.requester.id
  peer_vpc_id = aws_vpc.accepter.id
  auto_accept = true
  tags        = { Name = "vpc-peering" }
}

resource "aws_route" "requester_to_accepter" {
  route_table_id            = aws_route_table.requester.id
  destination_cidr_block    = aws_vpc.accepter.cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.peer.id
}
```

### 17. Network ACL
```hcl
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = [aws_subnet.public.id]

  ingress {
    rule_no    = 100
    action     = "allow"
    protocol   = "tcp"
    from_port  = 443
    to_port    = 443
    cidr_block = "0.0.0.0/0"
  }

  egress {
    rule_no    = 100
    action     = "allow"
    protocol   = "-1"
    from_port  = 0
    to_port    = 0
    cidr_block = "0.0.0.0/0"
  }
}
```

### 18. VPC Flow Logs to CloudWatch
```hcl
resource "aws_cloudwatch_log_group" "vpc_flow" {
  name              = "/aws/vpc/flow-logs"
  retention_in_days = 30
}

resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}
```

### 19. VPC Flow Logs to S3
```hcl
resource "aws_flow_log" "s3" {
  log_destination      = aws_s3_bucket.flow_logs.arn
  log_destination_type = "s3"
  traffic_type         = "REJECT"
  vpc_id               = aws_vpc.main.id
}
```

### 20. S3 VPC Endpoint (Gateway type)
```hcl
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]
  tags              = { Name = "s3-endpoint" }
}
```

### 21. Interface VPC Endpoint (SSM)
```hcl
resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.us-east-1.ssm"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.endpoint.id]
  private_dns_enabled = true
}
```

### 22. VPN Gateway
```hcl
resource "aws_vpn_gateway" "vpn_gw" {
  vpc_id            = aws_vpc.main.id
  amazon_side_asn   = 64512
  availability_zone = "us-east-1a"
  tags              = { Name = "vpn-gateway" }
}
```

### 23. Customer Gateway + Site-to-Site VPN
```hcl
resource "aws_customer_gateway" "on_prem" {
  bgp_asn    = 65000
  ip_address = "203.0.113.1"
  type       = "ipsec.1"
  tags       = { Name = "on-prem-cgw" }
}

resource "aws_vpn_connection" "site_to_site" {
  vpn_gateway_id      = aws_vpn_gateway.vpn_gw.id
  customer_gateway_id = aws_customer_gateway.on_prem.id
  type                = "ipsec.1"
  static_routes_only  = true
}
```

### 24. Security group rules as separate resources
```hcl
resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.web.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
```

### 25. Outputs for VPC and subnet IDs
```hcl
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}
```

---

## Nested

### 26. VPC module with dynamic subnets
```hcl
variable "subnet_config" {
  type = map(object({
    cidr = string
    az   = string
    public = bool
  }))
}

resource "aws_subnet" "this" {
  for_each                = var.subnet_config
  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = each.value.public
  tags = { Name = each.key }
}
```

### 27. Dynamic security group rules
```hcl
variable "ingress_rules" {
  type = list(object({
    port        = number
    protocol    = string
    cidr_blocks = list(string)
  }))
}

resource "aws_security_group" "dynamic" {
  name   = "dynamic-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }
}
```

### 28. Conditional NAT Gateway per AZ
```hcl
variable "single_nat" {
  type    = bool
  default = false
}

resource "aws_eip" "nat" {
  count  = var.single_nat ? 1 : length(local.azs)
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  count         = var.single_nat ? 1 : length(local.azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
}
```

### 29. Private subnets each routed to their own NAT
```hcl
resource "aws_route_table" "private" {
  count  = length(local.azs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[var.single_nat ? 0 : count.index].id
  }

  tags = { Name = "private-rt-${local.azs[count.index]}" }
}

resource "aws_route_table_association" "private" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}
```

### 30. VPC Peering cross-account with accepter
```hcl
provider "aws" {
  alias  = "peer_account"
  region = "us-east-1"
  assume_role { role_arn = "arn:aws:iam::999999999999:role/PeeringRole" }
}

resource "aws_vpc_peering_connection" "cross_account" {
  vpc_id      = aws_vpc.main.id
  peer_vpc_id = var.peer_vpc_id
  peer_owner_id = var.peer_account_id
}

resource "aws_vpc_peering_connection_accepter" "peer" {
  provider                  = aws.peer_account
  vpc_peering_connection_id = aws_vpc_peering_connection.cross_account.id
  auto_accept               = true
}
```

### 31. Multiple VPC endpoints from a map
```hcl
locals {
  interface_endpoints = {
    ssm       = "com.amazonaws.us-east-1.ssm"
    ssmmessages = "com.amazonaws.us-east-1.ssmmessages"
    ec2messages = "com.amazonaws.us-east-1.ec2messages"
    logs      = "com.amazonaws.us-east-1.logs"
  }
}

resource "aws_vpc_endpoint" "interface" {
  for_each            = local.interface_endpoints
  vpc_id              = aws_vpc.main.id
  service_name        = each.value
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.endpoint.id]
  private_dns_enabled = true
  tags = { Name = "${each.key}-endpoint" }
}
```

### 32. Security groups from a variable map
```hcl
variable "security_groups" {
  type = map(object({
    description = string
    ingress = list(object({
      port     = number
      protocol = string
      cidr     = string
    }))
  }))
}

resource "aws_security_group" "this" {
  for_each    = var.security_groups
  name        = each.key
  description = each.value.description
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = each.value.ingress
    content {
      from_port   = ingress.value.port
      to_port     = ingress.value.port
      protocol    = ingress.value.protocol
      cidr_blocks = [ingress.value.cidr]
    }
  }
}
```

### 33. Transit Gateway attachment
```hcl
resource "aws_ec2_transit_gateway" "tgw" {
  description = "Central TGW"
  tags        = { Name = "main-tgw" }
}

resource "aws_ec2_transit_gateway_vpc_attachment" "attach" {
  transit_gateway_id = aws_ec2_transit_gateway.tgw.id
  vpc_id             = aws_vpc.main.id
  subnet_ids         = aws_subnet.private[*].id
  tags               = { Name = "vpc-tgw-attach" }
}
```

### 34. Transit Gateway route table
```hcl
resource "aws_ec2_transit_gateway_route_table" "shared" {
  transit_gateway_id = aws_ec2_transit_gateway.tgw.id
  tags               = { Name = "shared-tgw-rt" }
}

resource "aws_ec2_transit_gateway_route_table_association" "assoc" {
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.attach.id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.shared.id
}
```

### 35. Prefix list for managed CIDR groups
```hcl
resource "aws_ec2_managed_prefix_list" "corp" {
  name           = "corp-cidrs"
  address_family = "IPv4"
  max_entries    = 10

  entry { cidr = "10.0.0.0/8"   description = "RFC1918-10" }
  entry { cidr = "172.16.0.0/12" description = "RFC1918-172" }
  entry { cidr = "192.168.0.0/16" description = "RFC1918-192" }
}

resource "aws_security_group_rule" "corp_access" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  prefix_list_ids   = [aws_ec2_managed_prefix_list.corp.id]
  security_group_id = aws_security_group.web.id
}
```

### 36. VPC with IPv6 CIDR
```hcl
resource "aws_vpc" "ipv6" {
  cidr_block                       = "10.0.0.0/16"
  assign_generated_ipv6_cidr_block = true
  tags                             = { Name = "ipv6-vpc" }
}

resource "aws_subnet" "ipv6" {
  vpc_id                          = aws_vpc.ipv6.id
  cidr_block                      = "10.0.1.0/24"
  ipv6_cidr_block                 = cidrsubnet(aws_vpc.ipv6.ipv6_cidr_block, 8, 1)
  assign_ipv6_address_on_creation = true
  availability_zone               = "us-east-1a"
}
```

### 37. Egress-only internet gateway (IPv6)
```hcl
resource "aws_egress_only_internet_gateway" "eigw" {
  vpc_id = aws_vpc.ipv6.id
  tags   = { Name = "eigw" }
}

resource "aws_route" "ipv6_egress" {
  route_table_id              = aws_route_table.private.id
  destination_ipv6_cidr_block = "::/0"
  egress_only_gateway_id      = aws_egress_only_internet_gateway.eigw.id
}
```

---

## Advanced

### 38. Full 3-tier VPC (public, app, data subnets)
```hcl
locals {
  tiers = { public = "10.0.0.0/20", app = "10.0.16.0/20", data = "10.0.32.0/20" }
  azs   = ["us-east-1a", "us-east-1b"]
}

resource "aws_subnet" "tiers" {
  for_each = { for pair in setproduct(keys(local.tiers), local.azs) :
    "${pair[0]}-${pair[1]}" => {
      tier = pair[0]
      az   = pair[1]
    }
  }
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(local.tiers[each.value.tier], 4, index(local.azs, each.value.az))
  availability_zone = each.value.az
  tags              = { Name = each.key, Tier = each.value.tier }
}
```

### 39. PrivateLink endpoint service
```hcl
resource "aws_lb" "nlb" {
  name               = "endpoint-nlb"
  internal           = true
  load_balancer_type = "network"
  subnets            = aws_subnet.private[*].id
}

resource "aws_vpc_endpoint_service" "service" {
  acceptance_required        = true
  network_load_balancer_arns = [aws_lb.nlb.arn]
  allowed_principals         = ["arn:aws:iam::111111111111:root"]
  tags                       = { Name = "my-endpoint-service" }
}
```

### 40. Transit Gateway with multiple VPC attachments
```hcl
resource "aws_ec2_transit_gateway_vpc_attachment" "spokes" {
  for_each = var.spoke_vpcs

  transit_gateway_id = aws_ec2_transit_gateway.tgw.id
  vpc_id             = each.value.vpc_id
  subnet_ids         = each.value.subnet_ids
  tags               = { Name = "tgw-${each.key}" }
}

resource "aws_ec2_transit_gateway_route" "spoke_routes" {
  for_each = var.spoke_vpcs

  destination_cidr_block         = each.value.cidr
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.shared.id
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.spokes[each.key].id
}
```

### 41. Hub-and-spoke with Transit Gateway and RAM sharing
```hcl
resource "aws_ram_resource_share" "tgw_share" {
  name                      = "tgw-share"
  allow_external_principals = false
}

resource "aws_ram_resource_association" "tgw" {
  resource_arn       = aws_ec2_transit_gateway.tgw.arn
  resource_share_arn = aws_ram_resource_share.tgw_share.arn
}

resource "aws_ram_principal_association" "spoke" {
  for_each           = toset(var.spoke_account_ids)
  principal          = each.value
  resource_share_arn = aws_ram_resource_share.tgw_share.arn
}
```

### 42. VPC with DHCP options
```hcl
resource "aws_vpc_dhcp_options" "custom" {
  domain_name          = "corp.internal"
  domain_name_servers  = ["AmazonProvidedDNS"]
  ntp_servers          = ["169.254.169.123"]
  netbios_node_type    = 2
  tags                 = { Name = "corp-dhcp" }
}

resource "aws_vpc_dhcp_options_association" "assoc" {
  vpc_id          = aws_vpc.main.id
  dhcp_options_id = aws_vpc_dhcp_options.custom.id
}
```

### 43. Route53 Resolver inbound endpoint
```hcl
resource "aws_route53_resolver_endpoint" "inbound" {
  name      = "inbound-dns"
  direction = "INBOUND"
  security_group_ids = [aws_security_group.dns.id]

  ip_address { subnet_id = aws_subnet.private[0].id }
  ip_address { subnet_id = aws_subnet.private[1].id }
}
```

### 44. Route53 Resolver forwarding rule
```hcl
resource "aws_route53_resolver_rule" "forward" {
  domain_name          = "corp.internal"
  name                 = "forward-corp"
  rule_type            = "FORWARD"
  resolver_endpoint_id = aws_route53_resolver_endpoint.outbound.id

  target_ip { ip = "10.100.1.10" }
  target_ip { ip = "10.100.1.11" }
}

resource "aws_route53_resolver_rule_association" "assoc" {
  resolver_rule_id = aws_route53_resolver_rule.forward.id
  vpc_id           = aws_vpc.main.id
}
```

### 45. VPC Endpoint Policy for S3
```hcl
resource "aws_vpc_endpoint" "s3_restricted" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = ["s3:GetObject", "s3:PutObject"]
      Resource  = ["arn:aws:s3:::my-allowed-bucket/*"]
    }]
  })
}
```

### 46. Network Firewall
```hcl
resource "aws_networkfirewall_firewall_policy" "policy" {
  name = "main-policy"
  firewall_policy {
    stateless_default_actions          = ["aws:forward_to_sfe"]
    stateless_fragment_default_actions = ["aws:forward_to_sfe"]
  }
}

resource "aws_networkfirewall_firewall" "firewall" {
  name                = "main-firewall"
  firewall_policy_arn = aws_networkfirewall_firewall_policy.policy.arn
  vpc_id              = aws_vpc.main.id
  subnet_mapping { subnet_id = aws_subnet.firewall.id }
}
```

### 47. Lattice — VPC Lattice service network
```hcl
resource "aws_vpclattice_service_network" "main" {
  name      = "main-service-network"
  auth_type = "AWS_IAM"
}

resource "aws_vpclattice_service_network_vpc_association" "assoc" {
  service_network_identifier = aws_vpclattice_service_network.main.id
  vpc_identifier             = aws_vpc.main.id
  security_group_ids         = [aws_security_group.lattice.id]
}
```

### 48. VPC IPAM pool
```hcl
resource "aws_vpc_ipam" "main" {
  operating_regions { region_name = "us-east-1" }
}

resource "aws_vpc_ipam_pool" "us_east" {
  address_family = "ipv4"
  ipam_scope_id  = aws_vpc_ipam.main.private_default_scope_id
  locale         = "us-east-1"
}

resource "aws_vpc_ipam_pool_cidr" "us_east" {
  ipam_pool_id = aws_vpc_ipam_pool.us_east.id
  cidr         = "10.0.0.0/8"
}

resource "aws_vpc" "ipam_managed" {
  ipv4_ipam_pool_id   = aws_vpc_ipam_pool.us_east.id
  ipv4_netmask_length = 16
}
```

### 49. Gateway Load Balancer endpoint for inline inspection
```hcl
resource "aws_lb" "gwlb" {
  name               = "inspection-gwlb"
  load_balancer_type = "gateway"
  subnets            = [aws_subnet.inspection.id]
}

resource "aws_vpc_endpoint_service" "gwlb" {
  gateway_load_balancer_arns = [aws_lb.gwlb.arn]
  acceptance_required        = false
}

resource "aws_vpc_endpoint" "gwlbe" {
  service_name      = aws_vpc_endpoint_service.gwlb.service_name
  subnet_ids        = [aws_subnet.spoke.id]
  vpc_id            = aws_vpc.spoke.id
  vpc_endpoint_type = "GatewayLoadBalancer"
}
```

### 50. Full production VPC — locals-driven multi-AZ with HA NAT
```hcl
locals {
  name   = "prod"
  region = "us-east-1"
  azs    = ["us-east-1a", "us-east-1b", "us-east-1c"]

  public_subnets   = [for i, az in local.azs : cidrsubnet("10.0.0.0/16", 4, i)]
  private_subnets  = [for i, az in local.azs : cidrsubnet("10.0.0.0/16", 4, i + 4)]
  database_subnets = [for i, az in local.azs : cidrsubnet("10.0.0.0/16", 4, i + 8)]
}

resource "aws_vpc" "prod" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags                 = { Name = local.name }
}

resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.prod.id
  cidr_block              = local.public_subnets[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false
  tags = {
    Name = "${local.name}-public-${local.azs[count.index]}"
    "kubernetes.io/role/elb" = "1"
  }
}

resource "aws_subnet" "private" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.prod.id
  cidr_block        = local.private_subnets[count.index]
  availability_zone = local.azs[count.index]
  tags = {
    Name = "${local.name}-private-${local.azs[count.index]}"
    "kubernetes.io/role/internal-elb" = "1"
  }
}

resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  count         = length(local.azs)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.igw]
}
```
