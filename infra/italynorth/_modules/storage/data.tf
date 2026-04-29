data "azurerm_resource_group" "sign_itn_rg" {
  name = "${local.project_itn_sign}-rg-01"
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
