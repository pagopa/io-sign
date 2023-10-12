resource "azurerm_user_assigned_identity" "runner" {
  location            = var.location
  name                = "${local.app_name}-runner"
  resource_group_name = azurerm_resource_group.identity.name
}

resource "azurerm_role_assignment" "environment_runner_github_runner_rg" {
  scope                = data.azurerm_resource_group.github_runner_rg.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.runner.principal_id
}

resource "azurerm_role_assignment" "environment_runner_io_sign_backend_rg" {
  scope                = data.azurerm_resource_group.backend.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.runner.principal_id
}

output "azure_environment_runner" {
  value = {
    app_name       = "${local.app_name}-runner"
    client_id      = azurerm_user_assigned_identity.runner.client_id
    application_id = azurerm_user_assigned_identity.runner.client_id
    object_id      = azurerm_user_assigned_identity.runner.principal_id
  }
}
