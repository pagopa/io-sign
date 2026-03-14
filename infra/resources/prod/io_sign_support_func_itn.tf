locals {
  io_sign_support_func_itn = {
    staging_disabled = ["GetSignatureRequest"]
    disabled         = [["GetSignatureRequest"]]
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT = 4
      AzureWebJobsDisableHomepage    = "true"
      NODE_ENV                       = "production"
      CosmosDbConnectionString       = module.cosmosdb_account.connection_strings[0]
      CosmosDbIssuerDatabaseName     = module.cosmosdb_sql_database_issuer.name
      CosmosDbUserDatabaseName       = module.cosmosdb_sql_database_user.name
      PdvTokenizerApiBasePath        = "https://api.tokenizer.pdv.pagopa.it"
      PdvTokenizerApiKey             = module.key_vault_secrets_itn.values["PdvTokenizerApiKey"].value
    }
  }
}

module "io_sign_support_func_itn" {
  source = "github.com/pagopa/terraform-azurerm-v3//function_app?ref=v8.35.0"

  name                = format("%s-support-func-01", local.project_itn_sign)
  location            = azurerm_resource_group.backend_rg_itn.location
  resource_group_name = azurerm_resource_group.backend_rg_itn.name

  health_check_path            = "/api/v1/sign/support/info"
  health_check_maxpingfailures = 2

  always_on = true

  runtime_version = "~4"
  node_version    = "20"

  app_service_plan_info = {
    name                         = format("%s-support-func-asp-01", local.project_itn_sign)
    kind                         = "Linux"
    sku_tier                     = var.io_sign_support_func.sku_tier
    sku_size                     = var.io_sign_support_func.sku_size
    maximum_elastic_worker_count = 0
    worker_count                 = 1
    zone_balancing_enabled       = false
  }

  app_settings = merge(
    local.io_sign_support_func_itn.app_settings,
    {
      for to_disable in local.io_sign_support_func_itn.staging_disabled :
      format("AzureWebJobs.%s.Disabled", to_disable) => contains(local.io_sign_support_func_itn.disabled, to_disable) ? "true" : "false"
    }
  )

  storage_account_info = {
    advanced_threat_protection_enable = false
    use_legacy_defender_version       = false
    public_network_access_enabled     = false
    account_kind                      = "StorageV2"
    account_tier                      = "Standard"
    account_replication_type          = "ZRS"
    access_tier                       = "Hot"
  }

  sticky_app_setting_names = [
    # Sticky the settings enabling triggered by queue and timer
    for to_disable in local.io_sign_support_func_itn.staging_disabled :
    format("AzureWebJobs.%s.Disabled", to_disable)
  ]

  storage_account_name = format("%ssupportstfn01", replace(local.project_itn_sign, "-", ""))

  subnet_id                     = module.io_sign_support_snet_itn.id
  ip_restriction_default_action = "Deny"
  allowed_subnets               = []

  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key
  system_identity_enabled                  = true

  tags = var.tags
}

module "io_sign_support_func_staging_slot_itn" {
  count  = var.io_sign_support_func.sku_tier == "PremiumV3" ? 1 : 0
  source = "github.com/pagopa/terraform-azurerm-v3//function_app_slot?ref=v8.35.0"

  name                = "staging"
  location            = azurerm_resource_group.backend_rg_itn.location
  resource_group_name = azurerm_resource_group.backend_rg_itn.name
  function_app_id     = module.io_sign_support_func_itn.id
  app_service_plan_id = module.io_sign_support_func_itn.app_service_plan_id

  health_check_path            = "/api/v1/sign/support/info"
  health_check_maxpingfailures = 2

  storage_account_name       = module.io_sign_support_func_itn.storage_account.name
  storage_account_access_key = module.io_sign_support_func_itn.storage_account.primary_access_key

  runtime_version                          = "~4"
  always_on                                = true
  node_version                             = "20"
  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key

  app_settings = merge(
    local.io_sign_support_func_itn.app_settings,
    {
      for to_disable in local.io_sign_support_func_itn.staging_disabled :
      format("AzureWebJobs.%s.Disabled", to_disable) => "true"
    }
  )

  subnet_id                     = module.io_sign_support_snet_itn.id
  ip_restriction_default_action = "Deny"
  allowed_subnets               = []

  tags = var.tags
}

resource "azurerm_monitor_autoscale_setting" "io_sign_support_func_itn" {
  count               = var.io_sign_support_func.sku_tier == "PremiumV3" ? 1 : 0
  name                = format("%s-autoscale", module.io_sign_support_func_itn.name)
  resource_group_name = azurerm_resource_group.backend_rg_itn.name
  location            = azurerm_resource_group.backend_rg_itn.location
  target_resource_id  = module.io_sign_support_func_itn.app_service_plan_id

  profile {
    name = "default"

    capacity {
      default = var.io_sign_support_func.autoscale_default
      minimum = var.io_sign_support_func.autoscale_minimum
      maximum = var.io_sign_support_func.autoscale_maximum
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.io_sign_support_func_itn.id
        metric_namespace         = "microsoft.web/sites"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "GreaterThan"
        threshold                = 3500
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "CpuPercentage"
        metric_resource_id       = module.io_sign_support_func_itn.app_service_plan_id
        metric_namespace         = "microsoft.web/serverfarms"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "GreaterThan"
        threshold                = 60
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "2"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.io_sign_support_func_itn.id
        metric_namespace         = "microsoft.web/sites"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "LessThan"
        threshold                = 2500
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT20M"
      }
    }

    rule {
      metric_trigger {
        metric_name              = "CpuPercentage"
        metric_resource_id       = module.io_sign_support_func_itn.app_service_plan_id
        metric_namespace         = "microsoft.web/serverfarms"
        time_grain               = "PT1M"
        statistic                = "Average"
        time_window              = "PT5M"
        time_aggregation         = "Average"
        operator                 = "LessThan"
        threshold                = 30
        divide_by_instance_count = false
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT20M"
      }
    }
  }

  tags = var.tags
}
