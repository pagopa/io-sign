data "azurerm_resource_group" "core_ext" {
  name = format("%s-rg-external", local.product)
}

data "azurerm_dns_zone" "io_italia_it" {
  name                = "io.italia.it"
  resource_group_name = data.azurerm_resource_group.core_ext.name
}
