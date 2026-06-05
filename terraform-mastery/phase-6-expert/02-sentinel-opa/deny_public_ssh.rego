# OPA Policy: deny_public_ssh.rego
# Block any Terraform plan that opens SSH port to 0.0.0.0/0
#
# Run: terraform show -json tfplan.json | conftest test - --policy .

package main

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_security_group"
  resource.change.actions[_] == "create"

  ingress := resource.change.after.ingress[_]
  ingress.from_port <= 22
  ingress.to_port >= 22
  ingress.cidr_blocks[_] == "0.0.0.0/0"

  msg := sprintf(
    "SECURITY: '%s' opens SSH (port 22) to the internet (0.0.0.0/0). Restrict to your VPN CIDR.",
    [resource.address]
  )
}

deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_s3_bucket"
  resource.change.actions[_] == "create"

  not resource.change.after.tags["Environment"]

  msg := sprintf(
    "COMPLIANCE: S3 bucket '%s' is missing required 'Environment' tag.",
    [resource.address]
  )
}

warn[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_instance"
  resource.change.actions[_] == "create"

  instance_type := resource.change.after.instance_type
  not startswith(instance_type, "t2.")
  not startswith(instance_type, "t3.")

  msg := sprintf(
    "COST: Instance '%s' uses type '%s'. Consider t2/t3 for non-production.",
    [resource.address, instance_type]
  )
}
