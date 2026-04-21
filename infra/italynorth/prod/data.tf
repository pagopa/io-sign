data "azurerm_private_dns_zone" "key_vault" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = data.azurerm_resource_group.weu-common.name
}

data "azurerm_resource_group" "weu-common" {
  name = "${local.prefix}-${local.env_short}-rg-common"
}

data "azurerm_api_management" "platform_apim" {
  resource_group_name = "${local.project_itn}-common-rg-01"
  name                = "${local.project_itn}-platform-api-gateway-apim-01"
}

data "azurerm_subscription" "current" {}