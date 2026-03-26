resource "azurerm_resource_group" "itn_sign_backend_rg" {
  name     = "${local.project_itn_sign}-backend-rg-01"
  location = local.location_itn
  tags     = var.tags
}

module "function_sign_support" {
  source  = "pagopa-dx/azure-function-app/azurerm"
  version = "~> 4.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location_itn
    app_name        = "${local.domain}-support"
    instance_number = local.instance_number
  }

  resource_group_name = azurerm_resource_group.itn_sign_backend_rg.name
  size                = "P0v3"
  node_version        = "20"

  virtual_network = {
    name                = var.vnet_common_name_itn
    resource_group_name = var.common_resource_group_name_itn
  }

  subnet_cidr                          = var.sign_support_snet_cidr
  health_check_path                    = "/api/v1/sign/support/info"
  subnet_pep_id                        = data.azurerm_subnet.private_endpoints_subnet_itn.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu-common.name

  app_settings = local.io_sign_support_func.app_settings

  slot_app_settings = local.io_sign_support_func.app_settings

  action_group_ids = [data.azurerm_monitor_action_group.common_error_action_group.id, data.azurerm_monitor_action_group.sign_error_action_group.id]

  tags = var.tags
}