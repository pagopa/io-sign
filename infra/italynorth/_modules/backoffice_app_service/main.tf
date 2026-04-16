module "itn_sign_backoffice_app" {
  source  = "pagopa-dx/azure-app-service/azurerm"
  version = "~> 2.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location_itn
    app_name        = "${local.domain}-backoffice"
    instance_number = local.instance_number
  }

  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
  size                = "P0v3"
  node_version        = "20"
  health_check_path   = "/info"

  subnet_cidr                          = var.sign_backoffice_app_snet_cidr
  subnet_pep_id                        = data.azurerm_subnet.private_endpoints_subnet_itn.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu-common.name
  virtual_network = {
    name                = var.vnet_common_name_itn
    resource_group_name = var.common_resource_group_name_itn
  }

  app_settings = local.io_sign_backoffice_app

  slot_app_settings = local.io_sign_backoffice_app

  tags = var.tags
}

module "itn_sign_bo_app_queue_role" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.itn_sign_backoffice_app.app_service.app_service.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  storage_queue = [
    {
      storage_account_name = data.azurerm_storage_account.storage_sign_weu.name
      resource_group_name  = data.azurerm_resource_group.sign_weu_data_rg.name
      queue_name           = "api-keys"
      role                 = "writer"
      description          = "Allow web app to write to the API keys queue"
    }
  ]
}

module "itn_sign_bo_app_queue_staging_role" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.itn_sign_backoffice_app.app_service.app_service.slot.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  storage_queue = [
    {
      storage_account_name = data.azurerm_storage_account.storage_sign_weu.name
      resource_group_name  = data.azurerm_resource_group.sign_weu_data_rg.name
      queue_name           = "api-keys"
      role                 = "writer"
      description          = "Allow web app to write to the API keys queue"
    }
  ]
}

module "itn_sign_bo_app_apim_role" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.itn_sign_backoffice_app.app_service.app_service.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  apim = [
    {
      name                = data.azurerm_api_management.apim.name
      resource_group_name = data.azurerm_api_management.apim.resource_group_name
      role                = "owner"
      description         = "API Management Service Contributor"
    }
  ]
}

module "itn_sign_bo_app_apim_staging_role" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.itn_sign_backoffice_app.app_service.app_service.slot.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  apim = [
    {
      name                = data.azurerm_api_management.apim.name
      resource_group_name = data.azurerm_api_management.apim.resource_group_name
      role                = "owner"
      description         = "API Management Service Contributor"
    }
  ]
}

module "itn_sign_backoffice_app_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.itn_sign_backoffice_app.app_service.app_service.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [
    {
      name                = data.azurerm_key_vault.sign_weu_kv.name
      resource_group_name = data.azurerm_key_vault.sign_weu_kv.resource_group_name
      description         = "Allow ${module.itn_sign_backoffice_app.app_service.app_service.name} to read secrets from ${data.azurerm_key_vault.sign_weu_kv.name}"
      has_rbac_support    = false
      roles = {
        secrets = "reader"
      }
    },
    {
      name                = data.azurerm_key_vault.sign_kv.name
      resource_group_name = data.azurerm_key_vault.sign_kv.resource_group_name
      description         = "Allow ${module.itn_sign_backoffice_app.app_service.app_service.name} to read secrets from ${data.azurerm_key_vault.sign_kv.name}"
      has_rbac_support    = true
      roles = {
        secrets = "reader"
      }
    }
  ]
}

module "itn_sign_backoffice_app_staging_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.itn_sign_backoffice_app.app_service.app_service.slot.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [
    {
      name                = data.azurerm_key_vault.sign_weu_kv.name
      resource_group_name = data.azurerm_key_vault.sign_weu_kv.resource_group_name
      description         = "Allow ${module.itn_sign_backoffice_app.app_service.app_service.slot.name} to read secrets from ${data.azurerm_key_vault.sign_weu_kv.name}"
      has_rbac_support    = false
      roles = {
        secrets = "reader"
      }
    },
    {
      name                = data.azurerm_key_vault.sign_kv.name
      resource_group_name = data.azurerm_key_vault.sign_kv.resource_group_name
      description         = "Allow ${module.itn_sign_backoffice_app.app_service.app_service.slot.name} to read secrets from ${data.azurerm_key_vault.sign_kv.name}"
      has_rbac_support    = true
      roles = {
        secrets = "reader"
      }
    }
  ]
}
