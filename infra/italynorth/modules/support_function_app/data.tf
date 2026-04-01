data "azurerm_subscription" "current" {}
data "azurerm_key_vault" "sign_weu_kv" {
  name                = "${local.project_weu_sign}-kv"
  resource_group_name = "${local.project_weu_sign}-sec-rg"
}

data "azurerm_resource_group" "sign_weu_integration_rg" {
  name = "${local.project_weu_sign}-integration-rg"
}

data "azurerm_resource_group" "sign_weu_backend_rg" {
  name = "${local.project_weu_sign}-backend-rg"
}

data "azurerm_resource_group" "sign_weu_data_rg" {
  name = "${local.project_weu_sign}-data-rg"
}

data "azurerm_resource_group" "sign_weu_sec_rg" {
  name = "${local.project_weu_sign}-sec-rg"
}

data "azurerm_resource_group" "weu-common" {
  name = "${local.prefix}-${local.env_short}-rg-common"
}

data "azurerm_subnet" "private_endpoints_subnet_itn" {
  name                 = "io-p-itn-pep-snet-01"
  virtual_network_name = var.vnet_common_name_itn
  resource_group_name  = var.common_resource_group_name_itn
}

data "azurerm_monitor_action_group" "common_error_action_group" {
  name                = "${local.prefix}${local.env_short}error"
  resource_group_name = "${local.prefix}-${local.env_short}-rg-common"
}

data "azurerm_monitor_action_group" "sign_error_action_group" {
  name                = "EmailFirmaConIoTech"
  resource_group_name = "${local.project_weu_sign}-integration-rg"
}

########################
# STORAGE
########################
data "azurerm_cosmosdb_account" "cosmos_sign_weu" {
  name                = "${local.project_weu_sign}-cosmos"
  resource_group_name = "${local.project_weu_sign}-data-rg"
}

data "azurerm_storage_account" "storage_sign_weu" {
  name                = "iopsignst"
  resource_group_name = "${local.project_weu_sign}-data-rg"
}

data "azurerm_nat_gateway" "nat_gateway_itn" {
  name                = format("%s-ng-01", local.project_itn)
  resource_group_name = format("%s-common-rg-01", local.project_itn)
}