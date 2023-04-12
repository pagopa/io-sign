resource "azuread_application" "environment_opex" {
  display_name = "${local.app_name}-opex"
}

resource "azuread_service_principal" "environment_opex" {
  application_id = azuread_application.environment_opex.application_id
}

resource "azuread_application_federated_identity_credential" "environment_opex" {
  application_object_id = azuread_application.environment_opex.object_id
  display_name          = "github-federated"
  description           = "github-federated"
  audiences             = ["api://AzureADTokenExchange"]
  issuer                = "https://token.actions.githubusercontent.com"
  subject               = "repo:${var.github.org}/${var.github.repository}:environment:${var.env}-opex"
}

resource "azurerm_role_assignment" "environment_opex_subscription" {
  scope                = data.azurerm_subscription.current.id
  role_definition_name = "Reader"
  principal_id         = azuread_service_principal.environment_opex.object_id
}

resource "azurerm_role_assignment" "environment_opex_storage_account_tfstate_app" {
  scope                = data.azurerm_storage_account.tfstate_app.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.environment_opex.object_id
}

resource "azurerm_role_assignment" "environment_opex_resource_group_dashboards" {
  scope                = data.azurerm_resource_group.dashboards.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.environment_opex.object_id
}

output "azure_environment_opex" {
  value = {
    app_name       = "${local.app_name}-opex"
    client_id      = azuread_service_principal.environment_opex.application_id
    application_id = azuread_service_principal.environment_opex.application_id
    object_id      = azuread_service_principal.environment_opex.object_id
  }
}
