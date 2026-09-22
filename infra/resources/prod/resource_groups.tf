resource "azurerm_resource_group" "sign" {
  name     = format("%s-itn-sign-rg-01", local.product)
  location = "italynorth"

  tags = var.tags
}

