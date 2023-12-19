module "opex_identity_ci" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.34.2"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain
  app_name  = "opex"

  identity_role = "ci"

  github_federations = [
    {
      repository = "io-sign"
      subject = github_repository_environment.github_repository_environment_opex_ci.environment
    }
  ]

  ci_rbac_roles = {
    subscription_roles = var.opex_environment_ci_roles.subscription
    resource_groups    = var.opex_environment_ci_roles.resource_groups
  }

  tags = var.tags
}

module "opex_identity_cd" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.34.2"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain
  app_name  = "opex"

  identity_role = "cd"

  github_federations = [
    {
      repository = "io-sign"
      subject = github_repository_environment.github_repository_environment_opex_cd.environment
    }
  ]

  cd_rbac_roles = {
    subscription_roles = var.opex_environment_cd_roles.subscription
    resource_groups    = var.opex_environment_cd_roles.resource_groups
  }

  tags = var.tags
}

# TODO: delete
resource "azurerm_user_assigned_identity" "opex" {
  location            = var.location
  name                = "${local.app_name}-opex"
  resource_group_name = azurerm_resource_group.identity.name
}

# TODO: delete
resource "azurerm_federated_identity_credential" "opex" {
  name                = "github-federated"
  resource_group_name = azurerm_resource_group.identity.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  parent_id           = azurerm_user_assigned_identity.opex.id
  subject             = "repo:${var.github.org}/${var.github.repository}:environment:${var.env}-opex"
}

# TODO: delete
resource "azurerm_role_assignment" "environment_opex_subscription" {
  scope                = data.azurerm_subscription.current.id
  role_definition_name = "Reader"
  principal_id         = azurerm_user_assigned_identity.opex.principal_id
}

# TODO: delete
resource "azurerm_role_assignment" "environment_opex_storage_account_tfstate_app" {
  scope                = data.azurerm_storage_account.tfstate_app.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.opex.principal_id
}

# TODO: delete
resource "azurerm_role_assignment" "environment_opex_resource_group_dashboards" {
  scope                = data.azurerm_resource_group.dashboards.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.opex.principal_id
}

# TODO: delete
output "azure_environment_opex" {
  value = {
    app_name       = "${local.app_name}-opex"
    client_id      = azurerm_user_assigned_identity.runner.client_id
    application_id = azurerm_user_assigned_identity.runner.client_id
    object_id      = azurerm_user_assigned_identity.runner.principal_id
  }
}
