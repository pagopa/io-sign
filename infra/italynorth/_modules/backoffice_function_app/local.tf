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

  io_sign_backoffice_func = {
    app_settings = {
      NODE_ENV                          = "production"
      SELFCARE_EVENT_HUB_CONTRACTS_NAME = "sc-contracts"
      BACK_OFFICE_API_BASE_PATH         = "https://api.io.pagopa.it/api/v1/sign/backoffice"
      COSMOS_DB_NAME                    = "backoffice"
      COSMOS_DB_CONNECTION_STRING       = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=COSMOS-DB-CONNECTION-STRING)"
      SelfCareEventHubConnectionString  = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=SelfCareEventHubConnectionString)"
      SLACK_WEBHOOK_URL                 = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=slack-webhook-url)"
      BACK_OFFICE_API_KEY               = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=BackOfficeApiKey)"
      GOOGLE_PRIVATE_KEY                = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=bo-google-private-key)"
      GOOGLE_CLIENT_EMAIL               = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=bo-google-client-email)"
      GOOGLE_SPREADSHEET_ID             = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=bo-google-spreadsheet-id)"
      SELFCARE_API_KEY                  = "@Microsoft.KeyVault(VaultName=${data.azurerm_key_vault.sign_kv.name};SecretName=selfcare-prod-api-key)"
      WEBSITE_SWAP_WARMUP_PING_PATH     = "/info"
      WEBSITE_SWAP_WARMUP_PING_STATUSES = "200,204"
    }
  }
}
