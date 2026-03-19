locals {
  io_sign_user_func = {
    staging_disabled = [
      "CreateSignatureRequest",
      "FillDocument",
      "UpdateSignatureRequest",
      "ValidateQtspSignature",
    ]
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT    = 4
      AzureWebJobsDisableHomepage       = "true"
      NODE_ENV                          = "production"
      NODE_TLS_REJECT_UNAUTHORIZED      = 0
      CosmosDbConnectionString          = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=COSMOS-DB-CONNECTION-STRING)"
      CosmosDbEndpoint                  = module.cosmosdb_account.endpoint
      CosmosDbDatabaseName              = module.cosmosdb_sql_database_user.name
      StorageAccountConnectionString    = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=STORAGE-ACCOUNT-CONNECTION-STRING)"
      userUploadedBlobContainerName     = azurerm_storage_container.uploaded_documents.name
      userValidatedBlobContainerName    = azurerm_storage_container.validated_documents.name
      IoServicesApiBasePath             = "https://api.io.pagopa.it"
      IoServicesSubscriptionKey         = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=IoServicesSubscriptionKey)"
      IoServicesConfigurationId         = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=io-services-configuration-id)"
      PdvTokenizerApiBasePath           = "https://api.tokenizer.pdv.pagopa.it"
      PdvTokenizerApiKey                = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=PdvTokenizerApiKey)"
      NamirialApiBasePath               = "https://pagopa.namirial.com"
      NamirialUsername                  = "api"
      NamirialPassword                  = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=NamirialPassword)"
      NamirialTestApiBasePath           = "https://pagopa-test.namirial.com"
      NamirialTestUsername              = "api"
      NamirialTestPassword              = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=NamirialTestPassword)"
      AnalyticsEventHubConnectionString = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=AnalyticsEventHubConnectionString)"
      BillingEventHubConnectionString   = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=BillingEventHubConnectionString)"
      SelfCareEventHubConnectionString  = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=SelfCareEventHubConnectionString)"
      SelfCareApiBasePath               = "https://api.selfcare.pagopa.it"
      SelfCareApiKey                    = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=SelfCareApiKey)"
      LollipopApiBasePath               = "https://api.io.pagopa.it"
      LollipopApiKey                    = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=LollipopPrimaryApiKey)"
      SlackWebhookUrl                   = "@Microsoft.KeyVault(VaultName=${module.key_vault.name};SecretName=SlackWebhookUrl)"
      IoLinkBaseUrl                     = "https://continua.io.pagopa.it"
      WEBSITE_SWAP_WARMUP_PING_PATH     = "/api/v1/sign/info"
      WEBSITE_SWAP_WARMUP_PING_STATUSES = "200,204"
    }
  }
}

module "io_sign_user_func" {
  source = "github.com/pagopa/terraform-azurerm-v4//function_app?ref=v9.4.2"

  app_service_plan_type = "internal"

  name                = format("%s-user-func", local.project)
  location            = azurerm_resource_group.backend_rg.location
  resource_group_name = azurerm_resource_group.backend_rg.name

  health_check_path            = "/api/v1/sign/info"
  health_check_maxpingfailures = 2

  node_version    = "20"
  runtime_version = "~4"
  always_on       = true

  app_service_plan_info = {
    kind                         = "Linux"
    sku_size                     = var.io_sign_user_func.sku_size
    maximum_elastic_worker_count = 0
    worker_count                 = 1
    zone_balancing_enabled       = false
  }

  app_settings = merge(
    local.io_sign_user_func.app_settings,
    {
      # Enable functions on production triggered by queue and timer
      for to_disable in local.io_sign_user_func.staging_disabled :
      format("AzureWebJobs.%s.Disabled", to_disable) => "false"
    }
  )

  sticky_app_setting_names = [
    # Sticky the settings enabling triggered by queue and timer
    for to_disable in local.io_sign_user_func.staging_disabled :
    format("AzureWebJobs.%s.Disabled", to_disable)
  ]

  subnet_id                     = module.io_sign_user_snet.id
  ip_restriction_default_action = "Deny"
  allowed_subnets               = []

  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key
  system_identity_enabled                  = true

  tags = var.tags
}

module "io_sign_user_func_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.io_sign_user_func.system_identity_principal
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [
    {
      name                = module.key_vault.name
      resource_group_name = module.key_vault.resource_group_name
      description         = "Allow ${module.io_sign_user_func.name} to read secrets from ${module.key_vault.name}"
      has_rbac_support    = false
      roles = {
        secrets = "reader"
      }
    }
  ]
}

module "io_sign_user_func_staging_slot" {
  source = "github.com/pagopa/terraform-azurerm-v4//function_app_slot?ref=v9.4.2"

  name                = "staging"
  location            = azurerm_resource_group.backend_rg.location
  resource_group_name = azurerm_resource_group.backend_rg.name
  function_app_id     = module.io_sign_user_func.id

  health_check_path            = "/api/v1/sign/info"
  health_check_maxpingfailures = 2

  storage_account_name       = module.io_sign_user_func.storage_account.name
  storage_account_access_key = module.io_sign_user_func.storage_account.primary_access_key

  node_version                             = "20"
  runtime_version                          = "~4"
  always_on                                = true
  application_insights_instrumentation_key = data.azurerm_application_insights.application_insights.instrumentation_key

  app_settings = merge(
    local.io_sign_user_func.app_settings,
    {
      # Disabled functions on slot triggered by queue and timer
      for to_disable in local.io_sign_user_func.staging_disabled :
      format("AzureWebJobs.%s.Disabled", to_disable) => "true"
    }
  )

  subnet_id                     = module.io_sign_user_snet.id
  ip_restriction_default_action = "Deny"
  allowed_subnets               = []

  system_identity_enabled = true

  tags = var.tags
}

module "io_sign_user_func_staging_slot_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = module.io_sign_user_func_staging_slot.system_identity_principal
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [
    {
      name                = module.key_vault.name
      resource_group_name = module.key_vault.resource_group_name
      description         = "Allow ${module.io_sign_user_func_staging_slot.name} to read secrets from ${module.key_vault.name}"
      has_rbac_support    = false
      roles = {
        secrets = "reader"
      }
    }
  ]
}

resource "azurerm_monitor_autoscale_setting" "io_sign_user_func" {
  count               = var.io_sign_user_func.sku_tier == "PremiumV3" ? 1 : 0
  name                = format("%s-autoscale", module.io_sign_user_func.name)
  resource_group_name = azurerm_resource_group.backend_rg.name
  location            = azurerm_resource_group.backend_rg.location
  target_resource_id  = module.io_sign_user_func.app_service_plan_id

  profile {
    name = "default"

    capacity {
      default = var.io_sign_user_func.autoscale_default
      minimum = var.io_sign_user_func.autoscale_minimum
      maximum = var.io_sign_user_func.autoscale_maximum
    }

    rule {
      metric_trigger {
        metric_name              = "Requests"
        metric_resource_id       = module.io_sign_user_func.id
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
        metric_resource_id       = module.io_sign_user_func.app_service_plan_id
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
        metric_resource_id       = module.io_sign_user_func.id
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
        metric_resource_id       = module.io_sign_user_func.app_service_plan_id
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
