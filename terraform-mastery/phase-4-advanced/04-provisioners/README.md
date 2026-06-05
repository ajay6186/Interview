# 4.4 — Provisioners

**Goal:** Use `local-exec`, `remote-exec`, and `null_resource` for post-create automation — and understand when NOT to use them.

## Provisioner Types

| Type | Runs on | Common use |
|------|---------|-----------|
| `local-exec` | Your machine (where Terraform runs) | Notifications, scripts, kubectl, helm |
| `remote-exec` | The created resource (via SSH/WinRM) | Software install, config on EC2 |
| `file` | Copies file to remote resource | Upload config files to EC2 |

## local-exec

```hcl
resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t2.micro"

  # Runs locally after EC2 is created
  provisioner "local-exec" {
    command = "ansible-playbook -i ${self.public_ip}, playbook.yml"
  }

  # Runs locally BEFORE EC2 is destroyed
  provisioner "local-exec" {
    when    = destroy
    command = "echo 'Deregistering ${self.id} from load balancer'"
  }
}
```

## remote-exec

```hcl
resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t2.micro"
  key_name      = aws_key_pair.main.key_name

  connection {
    type        = "ssh"
    user        = "ec2-user"
    private_key = file("~/.ssh/id_rsa")
    host        = self.public_ip
  }

  # Runs INSIDE the EC2 instance via SSH
  provisioner "remote-exec" {
    inline = [
      "sudo yum install -y nginx",
      "sudo systemctl start nginx",
    ]
  }
}
```

## null_resource — Run Scripts Without Creating Resources

```hcl
resource "null_resource" "run_migration" {
  triggers = {
    schema_hash = filemd5("schema.sql")  # re-runs when schema.sql changes
  }

  provisioner "local-exec" {
    command = "psql -h ${aws_db_instance.app.endpoint} -f schema.sql"
  }

  depends_on = [aws_db_instance.app]
}
```

## on_failure Options

```hcl
provisioner "local-exec" {
  command    = "curl https://notify.example.com/deploy"
  on_failure = continue   # ignore error, apply succeeds
  # on_failure = fail     # (default) fail the apply if command fails
}
```

## When NOT to Use Provisioners

Terraform's official guidance: **provisioners are a last resort**.

| Problem | Better Solution |
|---------|----------------|
| Install software on EC2 | `user_data` (cloud-init script) |
| Configure EC2 after boot | AWS Systems Manager (SSM) |
| Deploy application | Separate CI/CD pipeline |
| Kubernetes deploys | `helm_release` or `kubectl_manifest` providers |
| Database migrations | Separate migration tool (Flyway, Liquibase) |

**Why provisioners are problematic:**
- Not idempotent — re-running apply runs them again (with triggers)
- SSH/WinRM connectivity depends on network, firewalls
- State doesn't track what they did — only that they ran
- Failures leave partial state

## How to Run

```bash
terraform init
terraform apply -auto-approve
# Watch the local-exec commands print in the terminal
cat terraform-log.txt   # created by the provisioner

terraform destroy -auto-approve
# Watch the destroy provisioner fire
```

## Interview Questions

**Q: What is the difference between `local-exec` and `remote-exec`?**
> `local-exec` runs commands on the machine where Terraform is running (your laptop or CI server). `remote-exec` connects to the created resource via SSH or WinRM and runs commands on it.

**Q: Why are provisioners considered a last resort?**
> Provisioners break Terraform's declarative model — they're imperative scripts. They're not idempotent, depend on connectivity, and failures can leave resources in unknown states. Cloud-native alternatives (user_data, SSM, config management tools) are more reliable.
