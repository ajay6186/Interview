# 05 - Terraform CLI Commands

## Full Command Reference

### Core Workflow
```bash
terraform init          # download providers, set up backend
terraform validate      # check HCL syntax (no AWS calls)
terraform fmt           # auto-format all .tf files
terraform plan          # preview changes
terraform apply         # create/update resources
terraform destroy       # delete all resources
```

### Plan Flags
```bash
terraform plan -out=tfplan          # save plan to file
terraform apply tfplan              # apply saved plan (no prompt)
terraform plan -var="env=prod"      # override variable
terraform plan -target=aws_s3_bucket.main  # plan only one resource
terraform plan -destroy             # preview destroy
```

### State Commands
```bash
terraform state list
terraform state show <resource>
terraform state rm <resource>
terraform state mv <old> <new>
terraform import <resource> <aws-id>
```

### Workspace Commands
```bash
terraform workspace list
terraform workspace new dev
terraform workspace new prod
terraform workspace select dev
terraform workspace show
```

### Other Useful Commands
```bash
terraform output                    # show all outputs
terraform output -json              # outputs as JSON
terraform console                   # interactive HCL expression tester
terraform graph | dot -Tsvg > graph.svg  # visualize dependency graph
terraform version                   # show versions
terraform providers                 # show providers in use
terraform force-unlock <lock-id>    # unlock stuck state
```

## Terraform Console (very useful for learning)
```bash
terraform console
> 2 + 2
4
> "hello ${var.name}"
"hello world"
> [for i in range(3) : i * 2]
[0, 2, 4]
> cidrsubnet("10.0.0.0/16", 8, 1)
"10.0.1.0/24"
```

## Environment Variables
```bash
export TF_LOG=DEBUG          # verbose logging
export TF_LOG=INFO
export TF_VAR_region=us-east-1   # set variable
export AWS_PROFILE=myprofile     # use AWS named profile
```
