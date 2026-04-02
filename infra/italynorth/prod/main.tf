module "function_sign_support" {
  source                             = "../modules/support_function_app"
  vnet_common_name_itn               = local.vnet_common_name_itn
  common_resource_group_name_itn     = local.common_resource_group_name_itn
  sign_support_snet_cidr             = local.sign_support_snet_cidr
  function_support_autoscale_minimum = local.function_support_autoscale_minimum
  function_support_autoscale_maximum = local.function_support_autoscale_maximum
  function_support_autoscale_default = local.function_support_autoscale_default
  tags                               = local.tags
}

module "function_sign_issuer" {
  source                            = "../modules/issuer_function_app"
  vnet_common_name_itn              = local.vnet_common_name_itn
  common_resource_group_name_itn    = local.common_resource_group_name_itn
  sign_issuer_snet_cidr             = local.sign_issuer_snet_cidr
  function_issuer_autoscale_minimum = local.function_issuer_autoscale_minimum
  function_issuer_autoscale_maximum = local.function_issuer_autoscale_maximum
  function_issuer_autoscale_default = local.function_issuer_autoscale_default
  tags                              = local.tags
}

module "function_sign_user" {
  source                          = "../modules/user_function_app"
  vnet_common_name_itn            = local.vnet_common_name_itn
  common_resource_group_name_itn  = local.common_resource_group_name_itn
  sign_user_snet_cidr             = local.sign_user_snet_cidr
  function_user_autoscale_minimum = local.function_user_autoscale_minimum
  function_user_autoscale_maximum = local.function_user_autoscale_maximum
  function_user_autoscale_default = local.function_user_autoscale_default
  tags                            = local.tags
}

module "function_sign_backoffice" {
  source                                = "../modules/backoffice_function_app"
  vnet_common_name_itn                  = local.vnet_common_name_itn
  common_resource_group_name_itn        = local.common_resource_group_name_itn
  sign_backoffice_snet_cidr             = local.sign_backoffice_snet_cidr
  function_backoffice_autoscale_minimum = local.function_backoffice_autoscale_minimum
  function_backoffice_autoscale_maximum = local.function_backoffice_autoscale_maximum
  function_backoffice_autoscale_default = local.function_backoffice_autoscale_default
  tags                                  = local.tags
}

import {
  to = module.function_sign_support.azurerm_resource_group.itn_sign_backend_rg
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-itn-sign-backend-rg-01"
}
