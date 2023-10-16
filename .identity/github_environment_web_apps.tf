locals {
  resource_group_name = "${local.project}-backend-rg"
}

data "azurerm_resources" "web_apps" {
  resource_group_name = local.resource_group_name
  type                = "Microsoft.Web/sites"
}

locals {
  web_app_names = toset([for w in data.azurerm_resources.web_apps.resources : w.name])
}

data "github_team" "maintainers" {
  slug = "io-sign-maintainers"
}

resource "github_repository_environment" "web_apps" {
  for_each    = local.web_app_names
  environment = each.value
  repository  = var.github.repository
  reviewers {
    teams = [data.github_team.maintainers.id]
  }
}

resource "azurerm_federated_identity_credential" "web_apps" {
  for_each            = local.web_app_names
  name                = each.value
  resource_group_name = azurerm_resource_group.identity.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  parent_id           = azurerm_user_assigned_identity.runner.id
  subject             = "repo:${var.github.org}/${var.github.repository}:environment:${github_repository_environment.web_apps[each.key].environment}"
}

#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "web_app_subscription_id" {
  for_each        = local.web_app_names
  repository      = var.github.repository
  environment     = github_repository_environment.web_apps[each.key].environment
  secret_name     = "AZURE_SUBSCRIPTION_ID"
  plaintext_value = data.azurerm_subscription.current.subscription_id
}

#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "web_app_tenant_id" {
  for_each        = local.web_app_names
  repository      = var.github.repository
  environment     = github_repository_environment.web_apps[each.key].environment
  secret_name     = "AZURE_TENANT_ID"
  plaintext_value = data.azurerm_client_config.current.tenant_id
}

#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "web_app_client_id" {
  for_each        = local.web_app_names
  repository      = var.github.repository
  environment     = github_repository_environment.web_apps[each.key].environment
  secret_name     = "AZURE_CLIENT_ID"
  plaintext_value = azurerm_user_assigned_identity.runner.client_id
}

resource "github_actions_environment_variable" "web_app_resouce_group" {
  for_each      = local.web_app_names
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_RESOURCE_GROUP"
  value         = local.resource_group_name
}

resource "github_actions_environment_variable" "web_app_names" {
  for_each      = local.web_app_names
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_NAME"
  value         = each.value
}

resource "github_actions_environment_variable" "web_app_slots" {
  for_each      = local.web_app_names
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_SLOT"
  value         = "production"
}
