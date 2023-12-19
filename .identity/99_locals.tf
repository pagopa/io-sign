locals {
  prefix   = "${var.prefix}-${var.env_short}"
  project  = "${var.prefix}-${var.env_short}-${var.domain}"

  # TODO: delete
  app_name = "github-${var.github.org}-${var.github.repository}-${var.env}"

  repo_secrets = {
    "AZURE_SUBSCRIPTION_ID" = data.azurerm_client_config.current.subscription_id
    "AZURE_TENANT_ID"       = data.azurerm_client_config.current.tenant_id
  }

  opex_env_ci_secrets = {
    "AZURE_CLIENT_ID_CI" = module.opex_identity_ci.identity_client_id
  }

  opex_env_cd_secrets = {
    "AZURE_CLIENT_ID_CD" = module.opex_identity_cd.identity_client_id
  }
}
