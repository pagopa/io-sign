resource "azurerm_user_assigned_identity" "runner" {
  location            = var.location
  name                = "${local.app_name}-runner"
  resource_group_name = data.azurerm_resource_group.identity.name
}

resource "azurerm_federated_identity_credential" "runner" {
  name                = "github-federated"
  resource_group_name = data.azurerm_resource_group.identity.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  parent_id           = azurerm_user_assigned_identity.environment_runner.id
  subject             = "repo:${var.github.org}/${var.github.repository}:environment:${var.env}-runner"
}

resource "azurerm_role_assignment" "environment_runner_github_runner_rg" {
  scope                = data.azurerm_resource_group.github_runner_rg.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.environment_runner.principal_id
}

output "azure_environment_runner" {
  value = {
    app_name       = "${local.app_name}-runner"
    client_id      = azurerm_user_assigned_identity.environment_runner.client_id
    application_id = azurerm_user_assigned_identity.environment_runner.client_id
    object_id      = azurerm_user_assigned_identity.environment_runner.principal_id
  }
}
