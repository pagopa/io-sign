locals {
  backoffice_func_settings_itn = merge({
    COSMOS_DB_CONNECTION_STRING = module.cosmosdb_account.connection_strings[0],
    COSMOS_DB_NAME              = module.cosmosdb_sql_database_backoffice.name
    }, {
    for s in var.io_sign_backoffice_func.app_settings :
    s.name => s.key_vault_secret_name != null ? "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=${s.key_vault_secret_name})" : s.value
  })
  io_sign_backoffice_func_itn = {
    staging_disabled = ["onSelfcareContractsMessage", "getApiKey", "createApiKeyById"]
    disabled         = ["onSelfcareContractsMessage", "getApiKey", "createApiKeyById"]
  }
}

module "io_sign_backoffice_func_itn" {
  source = "github.com/pagopa/terraform-azurerm-v3//function_app?ref=v8.35.0"

  name                = format("%s-backoffice-func-01", local.project_itn_sign)
  location            = azurerm_resource_group.backend_rg_itn.location
  resource_group_name = azurerm_resource_group.backend_rg_itn.name

  health_check_path            = "/health"
  health_check_maxpingfailures = 2

  node_version    = "20"
  runtime_version = "~4"
  always_on       = true

  storage_account_info = {
    advanced_threat_protection_enable = false
    use_legacy_defender_version       = false
    public_network_access_enabled     = false
    account_kind                      = "StorageV2"
    account_tier                      = "Standard"
    account_replication_type          = "ZRS"
    access_tier                       = "Hot"
  }

  storage_account_name = format("%sbostfn01", replace(local.project_itn_sign, "-", ""))

  app_settings = merge(
    local.backoffice_func_settings_itn,
    {
      # Enable functions on production triggered by queue and timer
      for to_disable in local.io_sign_backoffice_func_itn.staging_disabled :
      format("AzureWebJobs.%s.Disabled", to_disable) => contains(local.io_sign_backoffice_func_itn.disabled, to_disable) ? "true" : "false"
    }
  )

  subnet_id = module.io_sign_backoffice_snet_itn.id

  sticky_app_setting_names = [
    for to_disable in local.io_sign_backoffice_func_itn.staging_disabled :
    format("AzureWebJobs.%s.Disabled", to_disable)
  ]

  ip_restriction_default_action = "Deny"

  allowed_subnets = []

  app_service_plan_id = module.io_sign_backoffice_app_itn.plan_id

  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key
  system_identity_enabled                  = true

  tags = var.tags
}

resource "azurerm_key_vault_access_policy" "backoffice_func_key_vault_access_policy_itn" {
  key_vault_id = module.key_vault.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = module.io_sign_backoffice_func_itn.system_identity_principal

  secret_permissions      = ["Get"]
  storage_permissions     = []
  certificate_permissions = []
}

module "io_sign_backoffice_func_staging_slot_itn" {
  source = "github.com/pagopa/terraform-azurerm-v3//function_app_slot?ref=v8.35.0"

  name                = "staging"
  location            = azurerm_resource_group.backend_rg_itn.location
  resource_group_name = azurerm_resource_group.backend_rg_itn.name

  function_app_id     = module.io_sign_backoffice_func_itn.id
  app_service_plan_id = module.io_sign_backoffice_func_itn.app_service_plan_id

  health_check_path            = "/health"
  health_check_maxpingfailures = 2

  storage_account_name       = module.io_sign_backoffice_func_itn.storage_account.name
  storage_account_access_key = module.io_sign_backoffice_func_itn.storage_account.primary_access_key

  node_version                             = "20"
  runtime_version                          = "~4"
  always_on                                = true
  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key

  app_settings = merge(
    local.backoffice_func_settings,
    {
      # Disabled functions on slot triggered by queue and timer
      for to_disable in local.io_sign_backoffice_func_itn.staging_disabled :
      format("AzureWebJobs.%s.Disabled", to_disable) => "true"
    }
  )

  subnet_id = module.io_sign_backoffice_snet_itn.id

  ip_restriction_default_action = "Deny"

  allowed_subnets = []

  tags = var.tags
}
