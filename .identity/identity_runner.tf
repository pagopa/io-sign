locals {
  github_federations = tolist([
    for w in local.web_apps_map : {
       repository = "io-sign"
       subject = github_repository_environment.web_apps[w.name].environment
    }
  ])
}

module "web_apps_identity_cd" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.34.2"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain

  identity_role = "cd"

  github_federations = local.github_federations

  cd_rbac_roles = {
    subscription_roles = var.web_apps_environment_cd_roles.subscription
    resource_groups    = var.web_apps_environment_cd_roles.resource_groups
  }

  tags = var.tags
}

# TODO: delete
resource "azurerm_user_assigned_identity" "runner" {
  location            = var.location
  name                = "${local.app_name}-runner"
  resource_group_name = azurerm_resource_group.identity.name
}

# TODO: delete
resource "azurerm_role_assignment" "environment_runner_github_runner_rg" {
  scope                = data.azurerm_resource_group.github_runner_rg.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.runner.principal_id
}

# TODO: delete
resource "azurerm_role_assignment" "environment_runner_io_sign_backend_rg" {
  scope                = data.azurerm_resource_group.backend.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.runner.principal_id
}

# TODO: delete
output "azure_environment_runner" {
  value = {
    app_name       = "${local.app_name}-runner"
    client_id      = azurerm_user_assigned_identity.runner.client_id
    application_id = azurerm_user_assigned_identity.runner.client_id
    object_id      = azurerm_user_assigned_identity.runner.principal_id
  }
}
