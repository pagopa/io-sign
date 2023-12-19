locals {
  resource_group_name = "${local.project}-backend-rg"
}

data "azurerm_resources" "web_apps" {
  resource_group_name = local.resource_group_name
  type                = "Microsoft.Web/sites"
}

locals {
  web_apps_map = { for w in data.azurerm_resources.web_apps.resources : w.name => w }
}

data "azurerm_linux_web_app" "web_apps" {
  for_each            = local.web_apps_map
  resource_group_name = local.resource_group_name
  name                = each.value.name
}

data "github_team" "maintainers" {
  slug = "io-sign-maintainers"
}

resource "github_repository_environment" "web_apps" {
  for_each    = local.web_apps_map
  environment = each.value.name
  repository  = var.github.repository
  reviewers {
    teams = [data.github_team.maintainers.id]
  }
}

# TODO: delete
resource "azurerm_federated_identity_credential" "web_apps" {
  for_each            = local.web_apps_map
  name                = each.value.name
  resource_group_name = azurerm_resource_group.identity.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  parent_id           = azurerm_user_assigned_identity.runner.id
  subject             = "repo:${var.github.org}/${var.github.repository}:environment:${github_repository_environment.web_apps[each.key].environment}"
}

# TODO: delete
#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "web_app_subscription_id" {
  for_each        = local.web_apps_map
  repository      = var.github.repository
  environment     = github_repository_environment.web_apps[each.key].environment
  secret_name     = "AZURE_SUBSCRIPTION_ID"
  plaintext_value = data.azurerm_subscription.current.subscription_id
}

# TODO: delete
#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "web_app_tenant_id" {
  for_each        = local.web_apps_map
  repository      = var.github.repository
  environment     = github_repository_environment.web_apps[each.key].environment
  secret_name     = "AZURE_TENANT_ID"
  plaintext_value = data.azurerm_client_config.current.tenant_id
}

resource "github_actions_environment_secret" "web_app_client_id" {
  for_each        = local.web_apps_map
  repository      = var.github.repository
  environment     = github_repository_environment.web_apps[each.key].environment
  secret_name     = "AZURE_CLIENT_ID"
  plaintext_value = module.web_apps_identity_cd.identity_client_id
}

resource "github_actions_environment_variable" "web_app_resouce_group" {
  for_each      = local.web_apps_map
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_RESOURCE_GROUP"
  value         = local.resource_group_name
}

resource "github_actions_environment_variable" "web_app_names" {
  for_each      = local.web_apps_map
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_NAME"
  value         = each.value.name
}

resource "github_actions_environment_variable" "health_check_path" {
  for_each      = local.web_apps_map
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "HEALTH_CHECK_PATH"
  value         = coalesce(data.azurerm_linux_web_app.web_apps[each.key].site_config[0].health_check_path, "/")
}
