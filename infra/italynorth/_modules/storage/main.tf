module "sign_storage_account" {
  source  = "pagopa-dx/azure-storage-account/azurerm"
  version = "~> 2.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location_itn
    app_name        = local.domain
    instance_number = local.instance_number
  }
  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
  use_case            = "default"
  subnet_pep_id       = data.azurerm_subnet.private_endpoints_subnet_itn.id

  subservices_enabled = {
    blob  = true
    queue = true
  }

  blob_features = {
    versioning = true
    change_feed = {
        enabled = true
    }
  }

  # queues = values(local.queues)
  queues = flatten([
    for queue in local.queues : (
      lookup(queue, "hasPoison", false) ? [queue.name, "${queue.name}-poison"] : [queue.name]
    )
  ])

  containers = [
    {
      name                  = "uploaded-documents"
      container_access_type = "private"
    },
    {
      name                  = "validated-documents"
      container_access_type = "private"
    },
    {
      name                  = "signed-documents"
      container_access_type = "private"
    },
    {
      name                  = "filled-modules"
      container_access_type = "private"
    }
  ]

  action_group_id = data.azurerm_monitor_action_group.common_error_action_group.id

  tags = var.tags
}

resource "azurerm_storage_management_policy" "io_sign_storage_management_policy" {
  storage_account_id = module.sign_storage_account.id

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
}

module "sign_storage_infra_ci_role" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azurerm_client_config.current.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  storage_queue = [{
    storage_account_name = module.sign_storage_account.name
    resource_group_name  = data.azurerm_resource_group.sign_itn_rg.name
    queue_name           = "*"
    role                 = "owner"
    description          = "Allow Terraform CI to manage storage queues"
  }]
}