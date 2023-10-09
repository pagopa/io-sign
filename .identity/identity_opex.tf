resource "azurerm_user_assigned_identity" "opex" {
  location            = var.location
  name                = "${local.app_name}-opex"
  resource_group_name = azurerm_resource_group.identity.name
}

resource "azurerm_federated_identity_credential" "opex" {
  name                = "github-federated"
  resource_group_name = azurerm_resource_group.identity.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  parent_id           = azurerm_user_assigned_identity.opex.id
  subject             = "repo:${var.github.org}/${var.github.repository}:environment:${var.env}-opex"
}

resource "azurerm_role_assignment" "environment_opex_subscription" {
  scope                = data.azurerm_subscription.current.id
  role_definition_name = "Reader"
  principal_id         = azurerm_user_assigned_identity.opex.principal_id
}

resource "azurerm_role_assignment" "environment_opex_storage_account_tfstate_app" {
  scope                = data.azurerm_storage_account.tfstate_app.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.opex.principal_id
}

resource "azurerm_role_assignment" "environment_opex_resource_group_dashboards" {
  scope                = data.azurerm_resource_group.dashboards.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.opex.principal_id
}

output "azure_environment_opex" {
  value = {
    app_name       = "${local.app_name}-opex"
    client_id      = azurerm_user_assigned_identity.runner.client_id
    application_id = azurerm_user_assigned_identity.runner.client_id
    object_id      = azurerm_user_assigned_identity.runner.principal_id
  }
}
