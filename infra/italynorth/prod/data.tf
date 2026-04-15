data "azurerm_private_dns_zone" "key_vault" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = data.azurerm_resource_group.weu-common.name
}

data "azurerm_resource_group" "weu-common" {
  name = "${local.prefix}-${local.env_short}-rg-common"
}