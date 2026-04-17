module "function_sign_support" {
  source                             = "../_modules/support_function_app"
  vnet_common_name_itn               = local.vnet_common_name_itn
  common_resource_group_name_itn     = local.common_resource_group_name_itn
  sign_support_snet_cidr             = local.sign_support_snet_cidr
  function_support_autoscale_minimum = local.function_support_autoscale_minimum
  function_support_autoscale_maximum = local.function_support_autoscale_maximum
  function_support_autoscale_default = local.function_support_autoscale_default
  tags                               = local.tags
}

module "function_sign_issuer" {
  source                            = "../_modules/issuer_function_app"
  vnet_common_name_itn              = local.vnet_common_name_itn
  common_resource_group_name_itn    = local.common_resource_group_name_itn
  sign_issuer_snet_cidr             = local.sign_issuer_snet_cidr
  function_issuer_autoscale_minimum = local.function_issuer_autoscale_minimum
  function_issuer_autoscale_maximum = local.function_issuer_autoscale_maximum
  function_issuer_autoscale_default = local.function_issuer_autoscale_default
  tags                              = local.tags
}

module "function_sign_user" {
  source                          = "../_modules/user_function_app"
  vnet_common_name_itn            = local.vnet_common_name_itn
  common_resource_group_name_itn  = local.common_resource_group_name_itn
  sign_user_snet_cidr             = local.sign_user_snet_cidr
  function_user_autoscale_minimum = local.function_user_autoscale_minimum
  function_user_autoscale_maximum = local.function_user_autoscale_maximum
  function_user_autoscale_default = local.function_user_autoscale_default
  tags                            = local.tags
}

module "function_sign_backoffice" {
  source                                = "../_modules/backoffice_function_app"
  vnet_common_name_itn                  = local.vnet_common_name_itn
  common_resource_group_name_itn        = local.common_resource_group_name_itn
  sign_backoffice_snet_cidr             = local.sign_backoffice_snet_cidr
  function_backoffice_autoscale_minimum = local.function_backoffice_autoscale_minimum
  function_backoffice_autoscale_maximum = local.function_backoffice_autoscale_maximum
  function_backoffice_autoscale_default = local.function_backoffice_autoscale_default
  tags                                  = local.tags
}

module "itn_sign_backoffice_app" {
  source = "../_modules/backoffice_app_service"

  vnet_common_name_itn           = local.vnet_common_name_itn
  common_resource_group_name_itn = local.common_resource_group_name_itn
  sign_backoffice_app_snet_cidr  = local.sign_backoffice_app_snet_cidr
}

module "sign_key_vault" {
  source                         = "../_modules/key_vault"
  tags                           = local.tags
  vnet_common_name_itn           = local.vnet_common_name_itn
  common_resource_group_name_itn = local.common_resource_group_name_itn
  vault_private_dns_zone_id      = data.azurerm_private_dns_zone.key_vault.id
}

module "platform_proxy_api" {
  source = "../_modules/platform_proxy_api"

  platform_apim_name                  = data.azurerm_api_management.platform_apim.name
  platform_apim_resource_group_name   = data.azurerm_api_management.platform_apim.resource_group_name
  platform_apim_id                    = data.azurerm_api_management.platform_apim.id
  platform_apim_identity_principal_id = data.azurerm_api_management.platform_apim.identity[0].principal_id

  key_vault_common_name_itn         = module.sign_key_vault.name
  key_vault_resource_group_name_itn = module.sign_key_vault.resource_group_name
  key_vault_common_uri_itn          = module.sign_key_vault.vault_uri
  subscription_id                   = data.azurerm_subscription.current.subscription_id
}

module "cosmos_io_sign" {
  source = "../modules/cosmos"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    app_name        = local.domain
    instance_number = local.instance_number
  }

  resource_group_name = local.cosmos_resource_group_name

  io_sign_database_issuer     = local.cosmos_io_sign_database_issuer
  io_sign_database_user       = local.cosmos_io_sign_database_user
  io_sign_database_backoffice = local.cosmos_io_sign_database_backoffice

  tags = local.tags
}
