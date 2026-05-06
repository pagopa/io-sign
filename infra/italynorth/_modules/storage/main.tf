# -----------------------------------------------
# Storage Account
# -----------------------------------------------
resource "azurerm_storage_account" "sign" {
  name                = "${local.prefix}${local.env_short}itn${local.domain}st${local.instance_number}"
  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
  location            = local.location_itn

  account_kind             = "StorageV2"
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  access_tier              = "Hot"

  public_network_access_enabled   = true
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true
  https_traffic_only_enabled      = true
  min_tls_version                 = "TLS1_2"
  cross_tenant_replication_enabled = false

  blob_properties {
    versioning_enabled  = true
    change_feed_enabled = true
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# -----------------------------------------------
# Containers
# -----------------------------------------------
resource "azurerm_storage_container" "sign" {
  for_each = toset([
    "uploaded-documents",
    "validated-documents",
    "signed-documents",
    "filled-modules",
  ])

  name                  = each.key
  storage_account_id    = azurerm_storage_account.sign.id
  container_access_type = "private"

  metadata = { for k, v in var.tags : lower(k) => lower(v) }
}

# -----------------------------------------------
# Queues
# -----------------------------------------------
resource "azurerm_storage_queue" "sign" {
  for_each = toset(flatten([
    for queue in local.queues : (
      lookup(queue, "hasPoison", false) ? [queue.name, "${queue.name}-poison"] : [queue.name]
    )
  ]))

  name                 = each.key
  storage_account_name = azurerm_storage_account.sign.name

  metadata = { for k, v in var.tags : lower(k) => lower(v) }
}

# -----------------------------------------------
# Private Endpoint - Blob
# -----------------------------------------------
resource "azurerm_private_endpoint" "sign_blob" {
  name                = "${local.project_itn_sign}-blob-pep-${local.instance_number}"
  location            = local.location_itn
  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
  subnet_id           = data.azurerm_subnet.private_endpoints_subnet_itn.id

  private_service_connection {
    name                           = "${local.project_itn_sign}-blob-pep-${local.instance_number}"
    private_connection_resource_id = azurerm_storage_account.sign.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.storage_blob.id]
  }

  tags = var.tags
}

# -----------------------------------------------
# Private Endpoint - Queue
# -----------------------------------------------
resource "azurerm_private_endpoint" "sign_queue" {
  name                = "${local.project_itn_sign}-queue-pep-${local.instance_number}"
  location            = local.location_itn
  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
  subnet_id           = data.azurerm_subnet.private_endpoints_subnet_itn.id

  private_service_connection {
    name                           = "${local.project_itn_sign}-queue-pep-${local.instance_number}"
    private_connection_resource_id = azurerm_storage_account.sign.id
    is_manual_connection           = false
    subresource_names              = ["queue"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.storage_queue.id]
  }

  tags = var.tags
}

# -----------------------------------------------
# Availability Alert
# -----------------------------------------------
resource "azurerm_monitor_metric_alert" "sign_storage_availability" {
  name                = "[${azurerm_storage_account.sign.name}] Low Availability"
  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
  scopes              = [azurerm_storage_account.sign.id]
  description         = "The average availability is less than 99.8%. Runbook: not needed."
  severity            = 0
  window_size         = "PT5M"
  frequency           = "PT5M"
  auto_mitigate       = false

  criteria {
    metric_namespace       = "Microsoft.Storage/storageAccounts"
    metric_name            = "Availability"
    aggregation            = "Average"
    operator               = "LessThan"
    threshold              = 99.8
    skip_metric_validation = false
  }

  action {
    action_group_id = data.azurerm_monitor_action_group.common_error_action_group.id
  }

  tags = var.tags
}

# -----------------------------------------------
# Lifecycle Policy
# -----------------------------------------------
resource "azurerm_storage_management_policy" "io_sign_storage_management_policy" {
  storage_account_id = azurerm_storage_account.sign.id

  rule {
    name    = "deleteafterdays"
    enabled = true
    filters {
      prefix_match = [
        "uploaded-documents",
        "validated-documents",
        "signed-documents",
      ]
      blob_types = ["blockBlob"]
    }
    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 90
      }
    }
  }

  rule {
    name    = "delete-filled-modules"
    enabled = true
    filters {
      prefix_match = ["filled-modules"]
      blob_types   = ["blockBlob"]
    }
    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 1
      }
    }
  }
}

# -----------------------------------------------
# CI Role Assignments
# -----------------------------------------------
module "sign_storage_infra_ci_role" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azurerm_client_config.current.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  storage_queue = [{
    storage_account_name = azurerm_storage_account.sign.name
    resource_group_name  = data.azurerm_resource_group.sign_itn_rg.name
    queue_name           = "*"
    role                 = "owner"
    description          = "Allow Terraform CI to manage storage queues"
  }]
}

# -----------------------------------------------
# Moved blocks - migrazione da modulo DX a risorse native
# Rimuovere questi blocchi dopo il primo apply andato a buon fine.
# -----------------------------------------------
moved {
  from = module.sign_storage_account.azurerm_storage_account.this
  to   = azurerm_storage_account.sign
}

moved {
  from = module.sign_storage_account.azurerm_private_endpoint.this["blob"]
  to   = azurerm_private_endpoint.sign_blob
}

moved {
  from = module.sign_storage_account.azurerm_private_endpoint.this["queue"]
  to   = azurerm_private_endpoint.sign_queue
}

moved {
  from = module.sign_storage_account.azurerm_storage_container.this["uploaded-documents"]
  to   = azurerm_storage_container.sign["uploaded-documents"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_container.this["validated-documents"]
  to   = azurerm_storage_container.sign["validated-documents"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_container.this["signed-documents"]
  to   = azurerm_storage_container.sign["signed-documents"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_container.this["filled-modules"]
  to   = azurerm_storage_container.sign["filled-modules"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["api-keys"]
  to   = azurerm_storage_queue.sign["api-keys"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["api-keys-poison"]
  to   = azurerm_storage_queue.sign["api-keys-poison"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["on-signature-request-ready"]
  to   = azurerm_storage_queue.sign["on-signature-request-ready"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["on-signature-request-ready-poison"]
  to   = azurerm_storage_queue.sign["on-signature-request-ready-poison"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["on-signature-request-rejected"]
  to   = azurerm_storage_queue.sign["on-signature-request-rejected"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["on-signature-request-rejected-poison"]
  to   = azurerm_storage_queue.sign["on-signature-request-rejected-poison"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["on-signature-request-signed"]
  to   = azurerm_storage_queue.sign["on-signature-request-signed"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["on-signature-request-signed-poison"]
  to   = azurerm_storage_queue.sign["on-signature-request-signed-poison"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["on-signature-request-wait-for-signature"]
  to   = azurerm_storage_queue.sign["on-signature-request-wait-for-signature"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["on-signature-request-wait-for-signature-poison"]
  to   = azurerm_storage_queue.sign["on-signature-request-wait-for-signature-poison"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["waiting-for-documents-to-fill"]
  to   = azurerm_storage_queue.sign["waiting-for-documents-to-fill"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["waiting-for-documents-to-fill-poison"]
  to   = azurerm_storage_queue.sign["waiting-for-documents-to-fill-poison"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["waiting-for-qtsp"]
  to   = azurerm_storage_queue.sign["waiting-for-qtsp"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["waiting-for-qtsp-poison"]
  to   = azurerm_storage_queue.sign["waiting-for-qtsp-poison"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["waiting-for-signature-request-updates"]
  to   = azurerm_storage_queue.sign["waiting-for-signature-request-updates"]
}

moved {
  from = module.sign_storage_account.azurerm_storage_queue.this["waiting-for-signature-request-updates-poison"]
  to   = azurerm_storage_queue.sign["waiting-for-signature-request-updates-poison"]
}

moved {
  from = module.sign_storage_account.azurerm_monitor_metric_alert.storage_account_health_check[0]
  to   = azurerm_monitor_metric_alert.sign_storage_availability
}