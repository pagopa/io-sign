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
  source = "../_modules/key_vault"
  tags   = local.tags
  naming_config = {
    prefix          = local.prefix
    environment     = local.env_short
    location        = local.location
    domain          = local.domain
    name            = "kv"
    instance_number = local.instance_number
  }
}

