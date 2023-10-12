locals {
  resource_group_name = "${local.project}-backend-rg"
}

data "azurerm_resources" "web_apps" {
  resource_group_name = local.resource_group_name
  type                = "Microsoft.Web/sites"
}

data "azurerm_resources" "web_apps_slots" {
  resource_group_name = local.resource_group_name
  type                = "Microsoft.Web/sites/slots"
}

locals {
  web_app_names = toset([for w in concat(data.azurerm_resources.web_apps.resources, data.azurerm_resources.web_apps_slots.resources) : w.name])
}

resource "github_repository_environment" "web_apps" {
  for_each    = local.web_app_names
  environment = replace(each.value, "/", "-")
  repository  = var.github.repository
}

resource "azurerm_federated_identity_credential" "web_apps" {
  for_each            = local.web_app_names
  name                = replace(each.value, "/", "-")
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
  value         = trimsuffix(each.value, "/staging")
}

resource "github_actions_environment_variable" "web_app_slots" {
  for_each      = local.web_app_names
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_SLOT"
  value         = endswith(each.value, "/staging") ? "staging" : "production"
}
