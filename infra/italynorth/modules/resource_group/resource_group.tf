resource "azurerm_resource_group" "itn_sign_rg" {
  name     = "${local.project_itn_sign}-rg-01"
  location = local.location
  tags     = local.tags
}