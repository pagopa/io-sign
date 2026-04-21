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

  io_sign_backoffice_app = {
    NODE_ENV                          = "production"
    HOSTNAME                          = "0.0.0.0"
    WEBSITE_RUN_FROM_PACKAGE          = "1"
    AZURE_SUBSCRIPTION_ID             = data.azurerm_subscription.current.subscription_id
    COSMOS_DB_NAME                    = "backoffice"
    COSMOS_DB_ENDPOINT                = data.azurerm_cosmosdb_account.cosmos_sign_weu.endpoint
    APIM_RESOURCE_GROUP_NAME          = data.azurerm_api_management.apim.resource_group_name,
    APIM_SERVICE_NAME                 = data.azurerm_api_management.apim.name,
    APIM_PRODUCT_NAME                 = "io-sign-api"
    WEBSITE_SWAP_WARMUP_PING_PATH     = "/info"
    WEBSITE_SWAP_WARMUP_PING_STATUSES = "200,204"
    APPINSIGHTS_INSTRUMENTATIONKEY    = sensitive(data.azurerm_application_insights.application_insights.instrumentation_key)
    COSMOS_DB_CONNECTION_STRING       = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=COSMOS-DB-CONNECTION-STRING)"
    AUTH_SESSION_SECRET               = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=bo-auth-session-secret)"
    SELFCARE_API_KEY                  = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=selfcare-prod-api-key)"
    PDV_TOKENIZER_API_KEY             = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=pdv-tokenizer-api-key)"
    SLACK_WEB_HOOK_URL                = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=slack-webhook-url)"
  }
}