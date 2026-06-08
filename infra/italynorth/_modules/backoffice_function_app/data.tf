data "azurerm_subscription" "current" {}

data "azurerm_key_vault" "sign_kv" {
  name                = "${local.project_itn_sign}-kv-${local.instance_number}"
  resource_group_name = "${local.project_itn_sign}-rg-${local.instance_number}"
}

data "azurerm_resource_group" "sign_itn_rg" {
  name = "${local.project_itn_sign}-rg-01"
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
  resource_group_name = "${local.project_itn_sign}-rg-01"
}

data "azurerm_application_insights" "application_insights" {
  name                = format("%s-ai-common", local.product)
  resource_group_name = format("%s-rg-common", local.product)
}
