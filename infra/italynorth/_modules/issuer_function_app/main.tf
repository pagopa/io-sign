module "function_sign_issuer" {
  source  = "pagopa-dx/azure-function-app/azurerm"
  version = "~> 4.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location_itn
    app_name        = "${local.domain}-issuer"
    instance_number = local.instance_number
  }

  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
  size                = "P0v3"
  node_version        = "20"

  virtual_network = {
    name                = var.vnet_common_name_itn
    resource_group_name = var.common_resource_group_name_itn
  }

  subnet_cidr                              = var.sign_issuer_snet_cidr
  health_check_path                        = "/api/v1/sign/info"
  subnet_pep_id                            = data.azurerm_subnet.private_endpoints_subnet_itn.id
  private_dns_zone_resource_group_name     = data.azurerm_resource_group.weu-common.name
  application_insights_key                 = data.azurerm_application_insights.application_insights.instrumentation_key
  application_insights_sampling_percentage = 100

  app_settings = local.io_sign_issuer_func.app_settings

  slot_app_settings = merge(
    local.io_sign_issuer_func.app_settings,
    {
      "AzureWebJobs.closeSignatureRequestRejected.Disabled" = "1"
      "AzureWebJobs.closeSignatureRequestSigned.Disabled"   = "1"
      "AzureWebJobs.createIssuerByVatNumberView.Disabled"   = "1"
      "AzureWebJobs.markAsWaitForSignature.Disabled"        = "1"
      "AzureWebJobs.validateUpload.Disabled"                = "1"
    }
  )

  sticky_app_setting_names = [
    "AzureWebJobs.closeSignatureRequestRejected.Disabled",
    "AzureWebJobs.closeSignatureRequestSigned.Disabled",
    "AzureWebJobs.createIssuerByVatNumberView.Disabled",
    "AzureWebJobs.markAsWaitForSignature.Disabled",
    "AzureWebJobs.validateUpload.Disabled",
  ]

  action_group_ids = [data.azurerm_monitor_action_group.common_error_action_group.id, data.azurerm_monitor_action_group.sign_error_action_group.id]

  tags = var.tags
}

module "itn_sign_issuer_func_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.function_sign_issuer.function_app.function_app.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [
    {
      name                = data.azurerm_key_vault.sign_weu_kv.name
      resource_group_name = data.azurerm_key_vault.sign_weu_kv.resource_group_name
      description         = "Allow ${module.function_sign_issuer.function_app.function_app.name} to read secrets from ${data.azurerm_key_vault.sign_weu_kv.name}"
      has_rbac_support    = false
      roles = {
        secrets = "reader"
      }
    }
  ]
}

module "itn_sign_issuer_func_staging_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.function_sign_issuer.function_app.function_app.slot.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [
    {
      name                = data.azurerm_key_vault.sign_weu_kv.name
      resource_group_name = data.azurerm_key_vault.sign_weu_kv.resource_group_name
      description         = "Allow ${module.function_sign_issuer.function_app.function_app.slot.name} to read secrets from ${data.azurerm_key_vault.sign_weu_kv.name}"
      has_rbac_support    = false
      roles = {
        secrets = "reader"
      }
    }
  ]
}

module "itn_sign_issuer_queue_role" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.function_sign_issuer.function_app.function_app.slot.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  storage_queue = [
    {
      storage_account_name = data.azurerm_storage_account.storage_sign_weu.name
      resource_group_name  = data.azurerm_resource_group.sign_weu_data_rg.name
      queue_name           = "api-keys"
      role                 = "reader"
      description          = "Allow web app to read from the API keys queue"
    }
  ]
}
