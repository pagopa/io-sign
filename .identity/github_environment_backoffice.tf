locals {
  github_environment = {
    backoffice_app = {
      name = "${local.project}-backoffice-app"
    }
  }
}

resource "github_repository_environment" "backoffice_app" {
  environment = local.github_environment.backoffice_app.name
  repository  = var.github.repository
  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "backoffice_app_azure_subscription_id" {
  repository      = var.github.repository
  environment     = local.github_environment.backoffice_app.name
  secret_name     = "AZURE_SUBSCRIPTION_ID"
  plaintext_value = data.azurerm_subscription.current.subscription_id
}

#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "backoffice_app_azure_tenant_id" {
  repository      = var.github.repository
  environment     = local.github_environment.backoffice_app.name
  secret_name     = "AZURE_TENANT_ID"
  plaintext_value = data.azurerm_client_config.current.tenant_id
}

#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "backoffice_app_azure_client_id" {
  repository      = var.github.repository
  environment     = local.github_environment.backoffice_app.name
  secret_name     = "AZURE_CLIENT_ID"
  plaintext_value = azurerm_user_assigned_identity.runner.client_id
}

#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "backoffice_app_azure_web_app_rg" {
  repository      = var.github.repository
  environment     = local.github_environment.backoffice_app.name
  secret_name     = "AZURE_WEB_APP_RESOURCE_GROUP"
  plaintext_value = "${local.project}-backend-rg"
}

#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "backoffice_app_azure_web_app_name" {
  repository      = var.github.repository
  environment     = local.github_environment.backoffice_app.name
  secret_name     = "AZURE_WEB_APP_NAME"
  plaintext_value = "${local.project}-backoffice-app"
}
