# Schema Validation — Examples

## Basic

### 1. Minimal values.schema.json
A bare-minimum schema file that allows any values but enables schema validation for a chart.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {}
}
```

---

### 2. String Type Validation
Enforce that a value is a string to prevent accidental integer or boolean input.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "appName": {
      "type": "string",
      "description": "The name of the application"
    }
  }
}
```

---

### 3. Integer Type Validation
Validate that `replicaCount` is an integer, rejecting float or string values.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "description": "Number of pod replicas"
    }
  }
}
```

---

### 4. Boolean Type Validation
Ensure a feature flag value is strictly a boolean `true` or `false`.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ingress": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        }
      }
    }
  }
}
```

---

### 5. Required Fields Array
Force the user to supply `image.repository` and `image.tag` or the install will fail.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["image"],
  "properties": {
    "image": {
      "type": "object",
      "required": ["repository", "tag"],
      "properties": {
        "repository": { "type": "string" },
        "tag":        { "type": "string" }
      }
    }
  }
}
```

---

### 6. Enum Validation (Allowed Values List)
Restrict `service.type` to the three valid Kubernetes service types.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "service": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["ClusterIP", "NodePort", "LoadBalancer"]
        }
      }
    }
  }
}
```

---

### 7. Minimum and Maximum for Numbers
Constrain `replicaCount` to be between 1 and 50 to prevent misconfiguration.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 50
    }
  }
}
```

---

### 8. minLength and maxLength for Strings
Require the app namespace to be at least 3 characters and no more than 63 (DNS limit).

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "nameOverride": {
      "type": "string",
      "minLength": 3,
      "maxLength": 63
    }
  }
}
```

---

### 9. Pattern (Regex) Validation
Ensure a `tag` value conforms to a semver-style format or `latest`.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "image": {
      "type": "object",
      "properties": {
        "tag": {
          "type": "string",
          "pattern": "^(latest|[0-9]+\\.[0-9]+\\.[0-9]+.*)$"
        }
      }
    }
  }
}
```

---

### 10. Default Values in Schema
Declare schema defaults; Helm will use these if the user omits the field.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "default": 1
    },
    "service": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "default": "ClusterIP"
        }
      }
    }
  }
}
```

---

### 11. helm install with Schema Validation Error
When required fields are missing, Helm prints a validation error and aborts the install.

```bash
# values.yaml is missing image.repository
helm install myapp ./mychart

# Output:
# Error: values don't meet the specifications of the schema(s)
#   in the chart(s):
# - image.repository: image.repository is required
```

---

### 12. helm lint with Schema Check
`helm lint` validates values against the schema before any deployment occurs.

```bash
helm lint ./mychart --values values.yaml

# Output when schema violation found:
# [ERROR] templates/: values don't meet the specifications of the schema(s)
#   - replicaCount: Must be of type integer
# Error: 1 chart(s) linted, 1 chart(s) failed
```

---

### 13. Array Type Validation
Validate that `tolerations` is an array (list), not a map or scalar.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "tolerations": {
      "type": "array",
      "items": {
        "type": "object"
      }
    }
  }
}
```

---

### 14. Object Type Validation
Ensure the `resources` key is always an object, never a string or boolean.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "resources": {
      "type": "object",
      "description": "CPU and memory resource requests and limits"
    }
  }
}
```

---

### 15. Nullable Fields Using anyOf
Allow a field to be either a string or null using `anyOf` for optional secret references.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "existingSecret": {
      "anyOf": [
        { "type": "string" },
        { "type": "null" }
      ],
      "description": "Name of an existing secret, or null to create a new one"
    }
  }
}
```

---

## Intermediate

### 16. Nested Object Schema for image
Define full schema for the `image` object including repository, tag, and pullPolicy.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": {
          "type": "string",
          "description": "Container image repository"
        },
        "tag": {
          "type": "string",
          "default": "latest"
        },
        "pullPolicy": {
          "type": "string",
          "enum": ["Always", "IfNotPresent", "Never"],
          "default": "IfNotPresent"
        }
      }
    }
  }
}
```

---

### 17. additionalProperties: false (Strict Mode)
Reject any unknown keys inside the `image` object to prevent typos in values files.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "image": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "repository": { "type": "string" },
        "tag":        { "type": "string" },
        "pullPolicy": { "type": "string" }
      }
    }
  }
}
```

---

### 18. Schema for replicaCount (Integer, Minimum 1)
Combine type, minimum, and description to produce a well-documented integer constraint.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 1,
      "description": "Number of application replicas. Must be at least 1."
    }
  }
}
```

---

### 19. Schema for service.type Enum
Validate service type while providing a clear error when an unsupported type is used.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "service": {
      "type": "object",
      "required": ["type", "port"],
      "additionalProperties": false,
      "properties": {
        "type": {
          "type": "string",
          "enum": ["ClusterIP", "NodePort", "LoadBalancer"],
          "default": "ClusterIP"
        },
        "port": {
          "type": "integer",
          "minimum": 1,
          "maximum": 65535,
          "default": 80
        }
      }
    }
  }
}
```

---

### 20. Schema for Resource Requests and Limits
Enforce that resources is an object with properly structured requests and limits.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "resources": {
      "type": "object",
      "properties": {
        "requests": {
          "type": "object",
          "properties": {
            "cpu":    { "type": "string", "pattern": "^[0-9]+(m|[0-9]*)$" },
            "memory": { "type": "string", "pattern": "^[0-9]+(Mi|Gi|Ki|M|G|K)$" }
          }
        },
        "limits": {
          "type": "object",
          "properties": {
            "cpu":    { "type": "string" },
            "memory": { "type": "string" }
          }
        }
      }
    }
  }
}
```

---

### 21. Schema for Ingress Hosts Array
Validate that `ingress.hosts` is an array of objects, each with a `host` string.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ingress": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "hosts": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["host"],
            "properties": {
              "host":  { "type": "string" },
              "paths": {
                "type": "array",
                "items": {
                  "type": "object",
                  "properties": {
                    "path":     { "type": "string" },
                    "pathType": { "type": "string", "enum": ["Prefix", "Exact", "ImplementationSpecific"] }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

---

### 22. Schema for env Vars Array of Objects
Validate that each item in the `env` array has at least a `name` field.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "env": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name":  { "type": "string" },
          "value": { "type": "string" },
          "valueFrom": { "type": "object" }
        }
      }
    }
  }
}
```

---

### 23. Schema for Labels Object with String Values
Ensure every label key and value is a string (Kubernetes requirement).

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "commonLabels": {
      "type": "object",
      "additionalProperties": {
        "type": "string"
      },
      "description": "Additional labels applied to all resources"
    }
  }
}
```

---

### 24. Schema with $ref for Reusable Definitions
Define a reusable `imageObject` definition and reference it in multiple fields.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "definitions": {
    "imageObject": {
      "type": "object",
      "properties": {
        "repository": { "type": "string" },
        "tag":        { "type": "string", "default": "latest" },
        "pullPolicy": { "type": "string", "enum": ["Always", "IfNotPresent", "Never"] }
      }
    }
  },
  "properties": {
    "image":      { "$ref": "#/definitions/imageObject" },
    "initImage":  { "$ref": "#/definitions/imageObject" },
    "agentImage": { "$ref": "#/definitions/imageObject" }
  }
}
```

---

### 25. Schema with if/then/else Conditional Validation
Require `ingress.hosts` to be non-empty only when `ingress.enabled` is true.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ingress": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "hosts":   { "type": "array" }
      },
      "if": {
        "properties": { "enabled": { "const": true } },
        "required": ["enabled"]
      },
      "then": {
        "required": ["hosts"],
        "properties": {
          "hosts": { "minItems": 1 }
        }
      }
    }
  }
}
```

---

### 26. Schema with oneOf / anyOf / allOf
Use `oneOf` to allow persistence config in two mutually exclusive forms.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "persistence": {
      "oneOf": [
        {
          "type": "object",
          "required": ["enabled"],
          "properties": {
            "enabled":      { "const": false }
          }
        },
        {
          "type": "object",
          "required": ["enabled", "size", "storageClass"],
          "properties": {
            "enabled":      { "const": true },
            "size":         { "type": "string" },
            "storageClass": { "type": "string" }
          }
        }
      ]
    }
  }
}
```

---

### 27. Schema with $defs (JSON Schema Draft 2020-12)
Use the modern `$defs` keyword (replaces `definitions`) for reusable sub-schemas.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "$defs": {
    "resourceQuantity": {
      "type": "string",
      "pattern": "^[0-9]+(m|Mi|Gi|Ki|M|G|K|)$"
    },
    "portNumber": {
      "type": "integer",
      "minimum": 1,
      "maximum": 65535
    }
  },
  "properties": {
    "service": {
      "type": "object",
      "properties": {
        "port":       { "$ref": "#/$defs/portNumber" },
        "targetPort": { "$ref": "#/$defs/portNumber" }
      }
    }
  }
}
```

---

## Nested

### 28. Full values.schema.json for a Node.js Chart
A production-ready schema covering the most common values for a Node.js application chart.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["image"],
  "properties": {
    "replicaCount": { "type": "integer", "minimum": 1, "default": 1 },
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": { "type": "string" },
        "tag":        { "type": "string", "default": "latest" },
        "pullPolicy": { "type": "string", "enum": ["Always", "IfNotPresent", "Never"], "default": "IfNotPresent" }
      }
    },
    "service": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["ClusterIP", "NodePort", "LoadBalancer"], "default": "ClusterIP" },
        "port": { "type": "integer", "default": 3000 }
      }
    },
    "env": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name":  { "type": "string" },
          "value": { "type": "string" }
        }
      }
    },
    "resources": { "type": "object" },
    "autoscaling": {
      "type": "object",
      "properties": {
        "enabled":                           { "type": "boolean", "default": false },
        "minReplicas":                       { "type": "integer", "minimum": 1 },
        "maxReplicas":                       { "type": "integer", "minimum": 1 },
        "targetCPUUtilizationPercentage":    { "type": "integer", "minimum": 1, "maximum": 100 }
      }
    }
  }
}
```

---

### 29. Schema with Complex Nested Objects
Deeply nested schema for a chart with multiple named components.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "backend": {
      "type": "object",
      "properties": {
        "image":        { "$ref": "#/definitions/imageObject" },
        "replicaCount": { "type": "integer", "minimum": 1 },
        "resources":    { "$ref": "#/definitions/resourcesObject" }
      }
    },
    "frontend": {
      "type": "object",
      "properties": {
        "image":        { "$ref": "#/definitions/imageObject" },
        "replicaCount": { "type": "integer", "minimum": 1 },
        "resources":    { "$ref": "#/definitions/resourcesObject" }
      }
    }
  },
  "definitions": {
    "imageObject": {
      "type": "object",
      "properties": {
        "repository": { "type": "string" },
        "tag":        { "type": "string" }
      }
    },
    "resourcesObject": {
      "type": "object",
      "properties": {
        "requests": { "type": "object" },
        "limits":   { "type": "object" }
      }
    }
  }
}
```

---

### 30. Schema for Feature Flags (Boolean Map)
Validate a `features` object where every value must be a boolean.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "features": {
      "type": "object",
      "additionalProperties": { "type": "boolean" },
      "properties": {
        "darkMode":        { "type": "boolean", "default": false },
        "betaDashboard":   { "type": "boolean", "default": false },
        "advancedSearch":  { "type": "boolean", "default": true  },
        "multiTenancy":    { "type": "boolean", "default": false }
      }
    }
  }
}
```

---

### 31. Schema Validation for Secrets Config
Validate the secrets configuration object, supporting both inline and external secret references.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "database": {
      "type": "object",
      "properties": {
        "existingSecret": {
          "anyOf": [{ "type": "string", "minLength": 1 }, { "type": "null" }]
        },
        "password": {
          "type": "string",
          "description": "Used only when existingSecret is null"
        },
        "secretKey": {
          "type": "string",
          "default": "db-password"
        }
      }
    }
  }
}
```

---

### 32. Schema with Cross-Field Dependency (if ingress.enabled then hosts required)
Enforce that when ingress is enabled, at least one host must be provided.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "ingress": {
      "type": "object",
      "properties": {
        "enabled":   { "type": "boolean" },
        "className": { "type": "string" },
        "hosts": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["host"],
            "properties": {
              "host": { "type": "string", "format": "hostname" }
            }
          }
        }
      },
      "if":   { "properties": { "enabled": { "const": true } } },
      "then": { "required": ["hosts"], "properties": { "hosts": { "minItems": 1 } } },
      "else": {}
    }
  }
}
```

---

### 33. Schema for HPA Config Object
Validate the Horizontal Pod Autoscaler configuration with correct numeric ranges.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "autoscaling": {
      "type": "object",
      "properties": {
        "enabled":                           { "type": "boolean", "default": false },
        "minReplicas":                       { "type": "integer", "minimum": 1, "default": 1 },
        "maxReplicas":                       { "type": "integer", "minimum": 1, "default": 10 },
        "targetCPUUtilizationPercentage":    { "type": "integer", "minimum": 1, "maximum": 100, "default": 80 },
        "targetMemoryUtilizationPercentage": { "type": "integer", "minimum": 1, "maximum": 100 }
      },
      "if":   { "properties": { "enabled": { "const": true } } },
      "then": {
        "required": ["minReplicas", "maxReplicas"],
        "properties": {
          "maxReplicas": { "minimum": 1 }
        }
      }
    }
  }
}
```

---

### 34. Schema for Persistence Config Object
Validate the PVC configuration including storageClass, size, and access modes.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "persistence": {
      "type": "object",
      "properties": {
        "enabled":      { "type": "boolean", "default": false },
        "storageClass": { "anyOf": [{ "type": "string" }, { "type": "null" }] },
        "accessModes": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["ReadWriteOnce", "ReadOnlyMany", "ReadWriteMany", "ReadWriteOncePod"]
          },
          "default": ["ReadWriteOnce"]
        },
        "size": {
          "type": "string",
          "pattern": "^[0-9]+(Ki|Mi|Gi|Ti|Pi|Ei|k|M|G|T|P|E)$",
          "default": "1Gi"
        },
        "existingClaim": { "anyOf": [{ "type": "string" }, { "type": "null" }] }
      }
    }
  }
}
```

---

### 35. Schema for Affinity Config
Validate the affinity object which accepts the standard Kubernetes affinity structure.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "affinity": {
      "type": "object",
      "properties": {
        "nodeAffinity": {
          "type": "object",
          "properties": {
            "requiredDuringSchedulingIgnoredDuringExecution":  { "type": "object" },
            "preferredDuringSchedulingIgnoredDuringExecution": { "type": "array" }
          }
        },
        "podAffinity":     { "type": "object" },
        "podAntiAffinity": { "type": "object" }
      }
    }
  }
}
```

---

### 36. Schema for Autoscaling with min <= max Validation
Use JSON Schema's cross-constraint to validate that minReplicas does not exceed maxReplicas.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "autoscaling": {
      "type": "object",
      "properties": {
        "enabled":     { "type": "boolean" },
        "minReplicas": { "type": "integer", "minimum": 1 },
        "maxReplicas": { "type": "integer", "minimum": 1 }
      },
      "allOf": [
        {
          "if": { "required": ["minReplicas", "maxReplicas"] },
          "then": {
            "properties": {
              "maxReplicas": { "minimum": 1 }
            }
          }
        }
      ]
    }
  }
}
```

---

### 37. Schema for Monitoring Config
Validate the monitoring/metrics object for Prometheus ServiceMonitor integration.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "metrics": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "serviceMonitor": {
          "type": "object",
          "properties": {
            "enabled":   { "type": "boolean", "default": false },
            "interval":  { "type": "string", "pattern": "^[0-9]+(s|m|h)$", "default": "30s" },
            "namespace": { "type": "string" },
            "labels":    { "type": "object", "additionalProperties": { "type": "string" } }
          }
        },
        "port": { "type": "integer", "default": 9090 },
        "path": { "type": "string", "default": "/metrics" }
      }
    }
  }
}
```

---

### 38. Schema for RBAC Config
Validate RBAC configuration including service account and role binding settings.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "serviceAccount": {
      "type": "object",
      "properties": {
        "create":      { "type": "boolean", "default": true },
        "name":        { "anyOf": [{ "type": "string" }, { "type": "null" }] },
        "annotations": { "type": "object", "additionalProperties": { "type": "string" } }
      }
    },
    "rbac": {
      "type": "object",
      "properties": {
        "create":             { "type": "boolean", "default": false },
        "rules": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["apiGroups", "resources", "verbs"],
            "properties": {
              "apiGroups": { "type": "array", "items": { "type": "string" } },
              "resources": { "type": "array", "items": { "type": "string" } },
              "verbs":     { "type": "array", "items": { "type": "string" } }
            }
          }
        }
      }
    }
  }
}
```

---

### 39. Schema with minReplicas <= maxReplicas Validation
A practical cross-field constraint using `if/then` to compare two fields indirectly via descriptions.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "autoscaling": {
      "type": "object",
      "description": "Autoscaling configuration. maxReplicas must be >= minReplicas.",
      "properties": {
        "minReplicas": {
          "type": "integer",
          "minimum": 1,
          "default": 1,
          "description": "Minimum number of replicas"
        },
        "maxReplicas": {
          "type": "integer",
          "minimum": 1,
          "default": 5,
          "description": "Maximum number of replicas (must be >= minReplicas)"
        }
      }
    }
  }
}
```

---

### 40. Schema with title and description on Every Field
Add documentation metadata to each property for IDE tooling and generated docs.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "title": "MyApp Helm Chart Values",
  "description": "Configuration values for the myapp Helm chart",
  "type": "object",
  "properties": {
    "replicaCount": {
      "title": "Replica Count",
      "description": "Number of application pod replicas to run",
      "type": "integer",
      "minimum": 1,
      "default": 1
    },
    "image": {
      "title": "Container Image",
      "description": "Docker image configuration for the main application container",
      "type": "object",
      "properties": {
        "repository": {
          "title": "Image Repository",
          "description": "The Docker registry and image name (e.g. nginx or myregistry.io/myapp)",
          "type": "string"
        },
        "tag": {
          "title": "Image Tag",
          "description": "The Docker image tag or digest to deploy",
          "type": "string",
          "default": "latest"
        }
      }
    }
  }
}
```

---

## Advanced

### 41. Production values.schema.json with All Fields
A comprehensive schema for a production-grade microservice chart.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "title": "Production Microservice Values",
  "type": "object",
  "required": ["image"],
  "additionalProperties": false,
  "properties": {
    "replicaCount":  { "type": "integer", "minimum": 1, "default": 1 },
    "image":         { "$ref": "#/definitions/image" },
    "imagePullSecrets": { "type": "array", "items": { "type": "object" } },
    "nameOverride":  { "type": "string" },
    "fullnameOverride": { "type": "string" },
    "serviceAccount":{ "$ref": "#/definitions/serviceAccount" },
    "podAnnotations":{ "type": "object", "additionalProperties": { "type": "string" } },
    "podSecurityContext": { "type": "object" },
    "securityContext":    { "type": "object" },
    "service":       { "$ref": "#/definitions/service" },
    "ingress":       { "$ref": "#/definitions/ingress" },
    "resources":     { "$ref": "#/definitions/resources" },
    "autoscaling":   { "$ref": "#/definitions/autoscaling" },
    "nodeSelector":  { "type": "object", "additionalProperties": { "type": "string" } },
    "tolerations":   { "type": "array" },
    "affinity":      { "type": "object" },
    "env":           { "type": "array" },
    "envFrom":       { "type": "array" }
  },
  "definitions": {
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": { "type": "string" },
        "tag":        { "type": "string", "default": "latest" },
        "pullPolicy": { "type": "string", "enum": ["Always", "IfNotPresent", "Never"] }
      }
    },
    "service": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["ClusterIP", "NodePort", "LoadBalancer"] },
        "port": { "type": "integer", "minimum": 1, "maximum": 65535 }
      }
    },
    "ingress": {
      "type": "object",
      "properties": {
        "enabled":    { "type": "boolean" },
        "className":  { "type": "string" },
        "hosts":      { "type": "array" },
        "tls":        { "type": "array" }
      }
    },
    "resources": {
      "type": "object",
      "properties": {
        "limits":   { "type": "object" },
        "requests": { "type": "object" }
      }
    },
    "autoscaling": {
      "type": "object",
      "properties": {
        "enabled":     { "type": "boolean" },
        "minReplicas": { "type": "integer", "minimum": 1 },
        "maxReplicas": { "type": "integer", "minimum": 1 }
      }
    },
    "serviceAccount": {
      "type": "object",
      "properties": {
        "create":      { "type": "boolean" },
        "annotations": { "type": "object" },
        "name":        { "type": "string" }
      }
    }
  }
}
```

---

### 42. Schema for Umbrella Chart Global Values
Validate the `global` object that is shared with all subcharts.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "global": {
      "type": "object",
      "properties": {
        "imageRegistry":    { "type": "string", "description": "Global Docker image registry prefix" },
        "imagePullSecrets": { "type": "array", "items": { "type": "object" } },
        "storageClass":     { "type": "string" },
        "env":              { "type": "string", "enum": ["development", "staging", "production"] },
        "clusterName":      { "type": "string" },
        "labels":           { "type": "object", "additionalProperties": { "type": "string" } }
      }
    }
  }
}
```

---

### 43. Schema CI/CD Validation with helm lint --strict
Use `helm lint --strict` in a CI pipeline to treat warnings as errors.

```bash
# .github/workflows/helm-lint.yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Helm
        uses: azure/setup-helm@v3
      - name: Lint chart with strict schema validation
        run: |
          helm lint ./charts/myapp \
            --values ./charts/myapp/values.yaml \
            --strict \
            --set image.repository=nginx \
            --set image.tag=latest
```

---

### 44. Schema for Multi-Environment Values
Validate values files for different environments using consistent schema.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "environment": {
      "type": "string",
      "enum": ["development", "staging", "production"],
      "description": "Target deployment environment"
    },
    "replicaCount": {
      "type": "integer",
      "minimum": 1,
      "description": "Replicas. Prod should use autoscaling instead."
    },
    "resources": {
      "type": "object",
      "properties": {
        "requests": {
          "type": "object",
          "properties": {
            "cpu":    { "type": "string" },
            "memory": { "type": "string" }
          }
        },
        "limits": {
          "type": "object",
          "properties": {
            "cpu":    { "type": "string" },
            "memory": { "type": "string" }
          }
        }
      }
    }
  }
}
```

---

### 45. Schema Evolution Strategy (Adding Fields Without Breaking)
Use `default` values and avoid marking new fields as `required` to maintain backward compatibility.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "replicaCount": { "type": "integer", "minimum": 1, "default": 1 },
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": { "type": "string" },
        "tag":        { "type": "string", "default": "latest" },
        "pullPolicy": { "type": "string", "default": "IfNotPresent" },
        "digest":     {
          "type": "string",
          "default": "",
          "description": "Added in chart v2.0.0. Overrides tag when set. Default empty maintains v1 behavior."
        }
      }
    },
    "podLabels": {
      "type": "object",
      "additionalProperties": { "type": "string" },
      "default": {},
      "description": "Added in chart v1.5.0. Empty default maintains backward compatibility."
    }
  }
}
```

---

### 46. Schema for Custom Resource Config
Validate values used to generate a Kubernetes Custom Resource (e.g., a Certificate CRD).

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "certificate": {
      "type": "object",
      "properties": {
        "enabled":    { "type": "boolean", "default": false },
        "issuerRef": {
          "type": "object",
          "required": ["name", "kind"],
          "properties": {
            "name":  { "type": "string" },
            "kind":  { "type": "string", "enum": ["Issuer", "ClusterIssuer"] },
            "group": { "type": "string", "default": "cert-manager.io" }
          }
        },
        "dnsNames": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1
        },
        "duration":    { "type": "string", "pattern": "^[0-9]+h$", "default": "2160h" },
        "renewBefore": { "type": "string", "pattern": "^[0-9]+h$", "default": "360h" }
      }
    }
  }
}
```

---

### 47. JSON Schema Tooling (ajv, jsonschema)
Validate Helm values outside of Helm using standard JSON Schema tools for CI.

```bash
# Install AJV CLI
npm install -g ajv-cli ajv-formats

# Convert values.yaml to JSON and validate
python3 -c "import sys, yaml, json; json.dump(yaml.safe_load(sys.stdin), sys.stdout)" \
  < values.yaml > values.json

# Validate against schema
ajv validate \
  --spec=draft7 \
  -s values.schema.json \
  -d values.json \
  --all-errors

# Python alternative using jsonschema
pip install jsonschema pyyaml
python3 - <<'EOF'
import yaml, json, jsonschema
with open("values.yaml") as f:   values = yaml.safe_load(f)
with open("values.schema.json") as f: schema = json.load(f)
jsonschema.validate(values, schema)
print("Validation passed")
EOF
```

---

### 48. Schema for Complex Dependency Configuration
Validate the `postgresql` dependency subchart configuration passed from the parent chart.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "postgresql": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "auth": {
          "type": "object",
          "properties": {
            "username":         { "type": "string", "default": "appuser" },
            "password":         { "type": "string" },
            "database":         { "type": "string", "default": "appdb" },
            "existingSecret":   { "anyOf": [{ "type": "string" }, { "type": "null" }] }
          }
        },
        "primary": {
          "type": "object",
          "properties": {
            "persistence": {
              "type": "object",
              "properties": {
                "enabled": { "type": "boolean", "default": true },
                "size":    { "type": "string", "default": "8Gi" }
              }
            }
          }
        }
      }
    },
    "externalDatabase": {
      "type": "object",
      "properties": {
        "host":     { "type": "string" },
        "port":     { "type": "integer", "default": 5432 },
        "username": { "type": "string" },
        "password": { "type": "string" },
        "database": { "type": "string" }
      }
    }
  }
}
```

---

### 49. Schema Validation Error Messages (Custom via description)
Use `description` and `title` to produce human-friendly error context in Helm output.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "title": "Application Chart Values",
  "type": "object",
  "required": ["image", "service"],
  "properties": {
    "image": {
      "title": "Container Image (REQUIRED)",
      "type": "object",
      "required": ["repository"],
      "description": "You must set image.repository. Example: image.repository=myregistry.io/myapp",
      "properties": {
        "repository": {
          "title": "Image Repository",
          "type": "string",
          "minLength": 1,
          "description": "Cannot be empty. Must be a valid Docker image repository path."
        },
        "tag": {
          "title": "Image Tag",
          "type": "string",
          "description": "Semver tag or 'latest'. Avoid 'latest' in production.",
          "default": "latest"
        }
      }
    },
    "service": {
      "title": "Kubernetes Service Configuration (REQUIRED)",
      "type": "object",
      "required": ["port"],
      "properties": {
        "port": {
          "title": "Service Port",
          "type": "integer",
          "minimum": 1,
          "maximum": 65535,
          "description": "Must be a valid port number between 1 and 65535."
        }
      }
    }
  }
}
```

---

### 50. Complete Production Schema for a Real-World App
A full schema for a production e-commerce application chart with all common patterns combined.

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "title": "E-Commerce App Helm Values",
  "description": "Values schema for the ecommerce application chart",
  "type": "object",
  "required": ["image"],
  "properties": {
    "replicaCount": { "type": "integer", "minimum": 1, "default": 2 },
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": { "type": "string" },
        "tag":        { "type": "string", "pattern": "^(latest|v?[0-9]+\\.[0-9]+\\.[0-9]+.*)$" },
        "pullPolicy": { "type": "string", "enum": ["Always", "IfNotPresent", "Never"], "default": "IfNotPresent" }
      }
    },
    "service": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["ClusterIP", "NodePort", "LoadBalancer"], "default": "ClusterIP" },
        "port": { "type": "integer", "minimum": 1, "maximum": 65535, "default": 8080 }
      }
    },
    "ingress": {
      "type": "object",
      "properties": {
        "enabled":    { "type": "boolean", "default": false },
        "className":  { "type": "string", "default": "nginx" },
        "hosts":      { "type": "array", "items": { "type": "object" } },
        "tls":        { "type": "array", "items": { "type": "object" } }
      }
    },
    "database": {
      "type": "object",
      "properties": {
        "host":           { "type": "string" },
        "port":           { "type": "integer", "default": 5432 },
        "name":           { "type": "string" },
        "existingSecret": { "anyOf": [{ "type": "string" }, { "type": "null" }] }
      }
    },
    "redis": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "host":    { "type": "string", "default": "redis-master" },
        "port":    { "type": "integer", "default": 6379 }
      }
    },
    "autoscaling": {
      "type": "object",
      "properties": {
        "enabled":                        { "type": "boolean", "default": true },
        "minReplicas":                    { "type": "integer", "minimum": 1, "default": 2 },
        "maxReplicas":                    { "type": "integer", "minimum": 1, "default": 20 },
        "targetCPUUtilizationPercentage": { "type": "integer", "minimum": 1, "maximum": 100, "default": 70 }
      }
    },
    "resources": {
      "type": "object",
      "default": {},
      "properties": {
        "requests": {
          "type": "object",
          "properties": {
            "cpu":    { "type": "string", "default": "100m" },
            "memory": { "type": "string", "default": "256Mi" }
          }
        },
        "limits": {
          "type": "object",
          "properties": {
            "cpu":    { "type": "string", "default": "500m" },
            "memory": { "type": "string", "default": "512Mi" }
          }
        }
      }
    },
    "metrics": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": true },
        "serviceMonitor": {
          "type": "object",
          "properties": {
            "enabled":  { "type": "boolean", "default": false },
            "interval": { "type": "string", "default": "30s" }
          }
        }
      }
    },
    "nodeSelector":  { "type": "object", "additionalProperties": { "type": "string" } },
    "tolerations":   { "type": "array" },
    "affinity":      { "type": "object" }
  }
}
```

---
