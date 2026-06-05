# 6.3 — Custom Terraform Provider

**Goal:** Understand how Terraform providers work internally and how to write a basic custom provider using the Plugin Framework.

## How Providers Work

```
Terraform Core
    │  Plugin Protocol (gRPC)
    ▼
Provider Binary (e.g., terraform-provider-aws)
    │  AWS SDK calls
    ▼
AWS API
```

Every provider is a separate binary that communicates with Terraform Core via gRPC using the Plugin SDK Protocol.

## When to Write a Custom Provider

- Your company has an internal API/service not available in public registry
- Need Terraform to manage resources from an obscure system (legacy DB, internal tool)
- Wrapping an existing CLI tool as Terraform resources
- Building a provider for a new cloud/SaaS platform

## Provider Structure (Go)

```
terraform-provider-mycompany/
├── main.go                    ← provider entrypoint
├── internal/
│   └── provider/
│       ├── provider.go        ← provider configuration
│       └── resource_widget.go ← one file per resource type
├── go.mod
└── Makefile
```

## Minimal Custom Provider (Go + Plugin Framework)

```go
// main.go
package main

import (
    "github.com/hashicorp/terraform-plugin-framework/providerserver"
    "github.com/mycompany/terraform-provider-mycompany/internal/provider"
)

func main() {
    providerserver.Serve(context.Background(), provider.New, providerserver.ServeOpts{
        Address: "registry.terraform.io/mycompany/mycompany",
    })
}
```

```go
// internal/provider/resource_widget.go
type widgetResource struct{ client *MyAPIClient }

func (r *widgetResource) Schema(_ context.Context, _ resource.SchemaRequest, resp *resource.SchemaResponse) {
    resp.Schema = schema.Schema{
        Attributes: map[string]schema.Attribute{
            "id":   schema.StringAttribute{Computed: true},
            "name": schema.StringAttribute{Required: true},
            "size": schema.Int64Attribute{Optional: true},
        },
    }
}

func (r *widgetResource) Create(ctx context.Context, req resource.CreateRequest, resp *resource.CreateResponse) {
    // 1. Read plan data
    var data WidgetModel
    resp.Diagnostics.Append(req.Plan.Get(ctx, &data)...)

    // 2. Call your API
    widget, err := r.client.CreateWidget(data.Name.ValueString())
    if err != nil { /* handle */ }

    // 3. Write state
    data.Id = types.StringValue(widget.ID)
    resp.Diagnostics.Append(resp.State.Set(ctx, &data)...)
}
```

## Using a Local Custom Provider

```hcl
# .terraformrc (or %APPDATA%\terraform.rc on Windows)
provider_installation {
  dev_overrides {
    "mycompany/mycompany" = "/path/to/terraform-provider-mycompany/bin"
  }
  direct {}
}
```

```hcl
# main.tf
terraform {
  required_providers {
    mycompany = {
      source  = "mycompany/mycompany"
      version = "~> 1.0"
    }
  }
}

resource "mycompany_widget" "example" {
  name = "my-widget"
  size = 42
}
```

## Publishing to Terraform Registry

```bash
# 1. Create GitHub repo: terraform-provider-<name>
# 2. Tag a release: git tag v1.0.0 && git push --tags
# 3. Register on registry.terraform.io
# 4. Registry automatically picks up GitHub releases
# 5. Users can then: source = "hashicorp/<name>" or "yourorg/<name>"
```

## Recommended Learning Path

1. Read HashiCorp's [Plugin Framework docs](https://developer.hashicorp.com/terraform/plugin/framework)
2. Clone a simple provider: `github.com/hashicorp/terraform-provider-hashicorp-http`
3. Build a provider for a mock REST API using `https://jsonplaceholder.typicode.com`
4. Implement: CRUD for one resource type + basic data source

## Interview Questions

**Q: What is a Terraform provider and how does it communicate with Terraform Core?**
> A provider is a separate binary that implements resource CRUD operations for a specific platform (AWS, Azure, etc.). It communicates with Terraform Core via gRPC using the Plugin SDK Protocol. Terraform Core handles state and planning; the provider handles API calls.

**Q: When would you write a custom provider vs using `http` data sources or `null_resource` with scripts?**
> Custom provider when: you need full CRUD lifecycle (create/read/update/delete) with proper state management, you'll reuse it across many resources/teams, or the resource has complex drift detection. Scripts via `null_resource` for one-off tasks where Terraform doesn't need to track the resource long-term.
