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

  io_sign_support_func = {
    app_settings = {
      FUNCTIONS_WORKER_PROCESS_COUNT    = 4
      AzureWebJobsDisableHomepage       = "true"
      NODE_ENV                          = "production"
      CosmosDbConnectionString          = "@Microsoft.KeyVault(VaultName=${module.sign_key_vault.name};SecretName=COSMOS-DB-CONNECTION-STRING)"
      CosmosDbEndpoint                  = data.azurerm_cosmosdb_account.cosmos_sign_weu.endpoint
      CosmosDbIssuerDatabaseName        = "issuer"
      CosmosDbUserDatabaseName          = "user"
      PdvTokenizerApiBasePath           = "https://api.tokenizer.pdv.pagopa.it"
      PdvTokenizerApiKey                = "@Microsoft.KeyVault(VaultName=${module.sign_key_vault.name};SecretName=PdvTokenizerApiKey)"
      WEBSITE_SWAP_WARMUP_PING_PATH     = "/api/v1/sign/support/info"
      WEBSITE_SWAP_WARMUP_PING_STATUSES = "200,204"
    }
  }
}
