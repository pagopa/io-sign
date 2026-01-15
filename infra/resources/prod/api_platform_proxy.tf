data "azurerm_api_management" "platform_apim" {
  resource_group_name = "${local.project_itn}-common-rg-01"
  name                = "${local.project_itn}-platform-api-gateway-apim-01"
}


module "io_platform_apim_api" {
  source = "../modules/platform_proxy_api"

  platform_apim_name                = data.azurerm_api_management.platform_apim.name
  platform_apim_resource_group_name = data.azurerm_api_management.platform_apim.resource_group_name
  platform_apim_id                  = data.azurerm_api_management.platform_apim.id

  key_vault_common_id = module.key_vault_itn.id
}
