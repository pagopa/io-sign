data "azurerm_resource_group" "sign_itn_rg" {
  name = "${local.project_itn_sign}-rg-01"
}

data "azurerm_subnet" "private_endpoints_subnet_itn" {
  name                 = "${local.project_itn}-pep-snet-01"
  virtual_network_name = var.vnet_common_name_itn
  resource_group_name  = var.common_resource_group_name_itn
}

data "azurerm_resource_group" "evt_rg" {
  name = "${local.prefix}-${local.env_short}-evt-rg"
}

data "azurerm_monitor_action_group" "common_error_action_group" {
  name                = "${local.prefix}${local.env_short}error"
  resource_group_name = "${local.prefix}-${local.env_short}-rg-common"
}

data "azurerm_key_vault" "sign_kv" {
  name                = "${local.project_itn_sign}-kv-${local.instance_number}"
  resource_group_name = "${local.project_itn_sign}-rg-${local.instance_number}"
}

data "azurerm_eventhub_authorization_rule" "billing_func" {
  depends_on          = [module.eventhub]
  name                = "io-sign-func-sender"
  namespace_name      = "${local.project_itn_sign}-evhns-${local.instance_number}"
  eventhub_name       = "billing"
  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
}

data "azurerm_eventhub_authorization_rule" "analytics_func" {
  depends_on          = [module.eventhub]
  name                = "io-sign-func-sender"
  namespace_name      = "${local.project_itn_sign}-evhns-${local.instance_number}"
  eventhub_name       = "analytics"
  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
}