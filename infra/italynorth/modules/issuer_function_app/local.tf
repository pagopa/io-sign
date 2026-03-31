locals {
  prefix           = "io"
  env_short        = "p"
  location_itn     = "italynorth"
  domain           = "sign"
  instance_number  = "01"
  project_weu_sign = format("%s-%s-%s", local.prefix, local.env_short, local.domain)
  product          = format("%s-%s", local.prefix, local.env_short)
  project_itn      = "${local.product}-itn"
  project_itn_sign = format("%s-%s-itn-%s", local.prefix, local.env_short, local.domain)

  io_sign_issuer_func = {
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT    = 4
      AzureWebJobsDisableHomepage       = "true"
      NODE_ENV                          = "production"
      CosmosDbConnectionString          = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=COSMOS-DB-CONNECTION-STRING)"
      CosmosDbEndpoint                  = data.azurerm_cosmosdb_account.cosmos_sign_weu.endpoint
      CosmosDbDatabaseName              = "issuer"
      StorageAccountConnectionString    = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=STORAGE-ACCOUNT-CONNECTION-STRING)"
      IssuerUploadedBlobContainerName   = "uploaded-documents"
      IssuerValidatedBlobContainerName  = "validated-documents"
      IoServicesApiBasePath             = "https://api.io.pagopa.it"
      IoServicesSubscriptionKey         = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=IoServicesSubscriptionKey)"
      IoServicesConfigurationId         = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=io-services-configuration-id)"
      PdvTokenizerApiBasePath           = "https://api.tokenizer.pdv.pagopa.it"
      PdvTokenizerApiKey                = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=PdvTokenizerApiKey)"
      AnalyticsEventHubConnectionString = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=AnalyticsEventHubConnectionString)"
      BillingEventHubConnectionString   = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=BillingEventHubConnectionString)"
      SelfCareEventHubConnectionString  = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=SelfCareEventHubConnectionString)"
      SelfCareApiBasePath               = "https://api.selfcare.pagopa.it"
      SelfCareApiKey                    = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=SelfCareApiKey)"
      SlackWebhookUrl                   = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=SlackWebhookUrl)"
      BackOfficeApiBasePath             = "https://api.io.pagopa.it/api/v1/sign/backoffice"
      BackOfficeApiKey                  = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_weu_kv.name};SecretName=BackOfficeApiKey)"
      WEBSITE_SWAP_WARMUP_PING_PATH     = "/api/v1/sign/info"
      WEBSITE_SWAP_WARMUP_PING_STATUSES = "200,204"
      APPINSIGHTS_INSTRUMENTATIONKEY    = sensitive(data.azurerm_application_insights.application_insights.instrumentation_key)
      APPINSIGHTS_SAMPLING_PERCENTAGE   = 5
    }
  }
}