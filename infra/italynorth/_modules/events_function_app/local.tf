locals {
  prefix           = "io"
  env_short        = "p"
  location_itn     = "italynorth"
  domain           = "sign"
  instance_number  = "01"
  product          = format("%s-%s", local.prefix, local.env_short)
  project_itn      = "${local.product}-itn"
  project_itn_sign = format("%s-%s-itn-%s", local.prefix, local.env_short, local.domain)

  io_sign_events_func = {
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT                   = 4
      AzureWebJobsDisableHomepage                      = "true"
      NODE_ENV                                         = "production"
      USE_STORAGE_MANAGED_IDENTITY                     = "true"
      SIGN_STORAGE__queueServiceUri                    = var.storage_account.queue_service_uri
      StorageAccountItnConnectionString                = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=STORAGE-ACCOUNT-ITN-CONNECTION-STRING)"
      SignEventsHubItnConnectionString                 = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=SignEventsHubItnConnectionString)"
      BackofficeFuncBaseUrl                            = "https://${data.azurerm_linux_function_app.backoffice_func.default_hostname}"
      BackofficeFuncApiKey                             = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=BackofficeFuncApiKey)"
      AnalyticsEventHubItnConnectionString             = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=AnalyticsEventHubItnConnectionString)"
      BillingEventHubItnConnectionString               = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=BillingEventHubItnConnectionString)"
      WEBSITE_SWAP_WARMUP_PING_PATH                    = "/api/v1/sign/events/info"
      WEBSITE_SWAP_WARMUP_PING_STATUSES                = "200,204"
      IoSignKeyVaultUrl                                = "https://${data.azurerm_key_vault.sign_kv.name}.vault.azure.net"
      "AzureWebJobs.signEventTrigger_webhook.Disabled" = "0"
    }
  }
}
