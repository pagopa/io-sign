resource "azuread_application" "environment_cd" {
  display_name = "${local.app_name}-cd"
}

resource "azuread_service_principal" "environment_cd" {
  application_id = azuread_application.environment_cd.application_id
}

resource "azuread_application_federated_identity_credential" "environment_cd" {
  application_object_id = azuread_application.environment_cd.object_id
  display_name          = "github-federated"
  description           = "github-federated"
  audiences             = ["api://AzureADTokenExchange"]
  issuer                = "https://token.actions.githubusercontent.com"
  subject               = "repo:${var.github.org}/${var.github.repository}:environment:${var.env}-cd"
}

resource "azurerm_role_assignment" "environment_cd_subscription" {
  for_each             = toset(var.environment_cd_roles.subscription)
  scope                = data.azurerm_subscription.current.id
  role_definition_name = each.key
  principal_id         = azuread_service_principal.environment_cd.object_id
}

resource "azurerm_role_assignment" "environment_cd_resource_group" {
  for_each             = { for entry in local.environment_cd_resource_group_roles : "${entry.role}.${entry.resource_group}" => entry }
  scope                = data.azurerm_resource_group.environment_cd_resource_groups[each.value.resource_group].id
  role_definition_name = each.value.role
  principal_id         = azuread_service_principal.environment_cd.object_id
}

output "azure_environment_cd" {
  value = {
    app_name       = "${local.app_name}-cd"
    client_id      = azuread_service_principal.environment_cd.application_id
    application_id = azuread_service_principal.environment_cd.application_id
    object_id      = azuread_service_principal.environment_cd.object_id
  }
}
