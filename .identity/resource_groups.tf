resource "azurerm_resource_group" "identity" {
  name     = "${local.project}-identity-rg"
  location = var.location
}
