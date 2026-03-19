data "azurerm_api_management" "platform_apim" {
  resource_group_name = "${local.project_itn}-common-rg-01"
  name                = "${local.project_itn}-platform-api-gateway-apim-01"
}


module "io_platform_apim_api" {
  source = "../modules/platform_proxy_api"

  platform_apim_name                  = data.azurerm_api_management.platform_apim.name
  platform_apim_resource_group_name   = data.azurerm_api_management.platform_apim.resource_group_name
  platform_apim_id                    = data.azurerm_api_management.platform_apim.id
  platform_apim_identity_principal_id = data.azurerm_api_management.platform_apim.identity[0].principal_id

  key_vault_common_name         = module.key_vault_itn.name
  key_vault_resource_group_name = module.key_vault_itn.resource_group_name
  subscription_id               = data.azurerm_subscription.current.subscription_id
  key_vault_common_uri          = module.key_vault_itn.vault_uri
}
