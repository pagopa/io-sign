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

data "azurerm_key_vault" "sign_weu_kv" {
  name                = "${local.project_weu_sign}-kv"
  resource_group_name = "${local.project_weu_sign}-sec-rg"
}

data "azurerm_api_management" "apim_itn" {
  name                = "${local.project_itn}-apim-01"
  resource_group_name = "${local.project_itn}-common-rg-01"
}

data "azurerm_cosmosdb_account" "sign_cosmos" {
  name                = "${local.project_weu_sign}-cosmos"
  resource_group_name = "${local.project_weu_sign}-data-rg"
}

data "azurerm_subscription" "current" {}