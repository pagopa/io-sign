locals {
  prefix           = "io"
  env_short        = "p"
  location         = "italynorth"
  domain           = "sign"
  instance_number  = "01"
  product          = format("%s-%s", local.prefix, local.env_short)
  project_weu_sign = format("%s-%s-%s", local.prefix, local.env_short, local.domain)
  project_itn      = "${local.prefix}-${local.env_short}-itn"
  project_itn_sign = format("%s-%s-itn-%s", local.prefix, local.env_short, local.domain)

  tags = {
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "IO"
    Source         = "https://github.com/pagopa/io-sign",
    ManagementTeam = "IO Ecosystem - Links",
    CostCenter     = "TS000 - Tecnologia e Servizi"
  }
  vnet_common_name_itn           = "${local.project_itn}-common-vnet-01"
  common_resource_group_name_itn = "${local.project_itn}-common-rg-01"

  #support function app
  sign_support_snet_cidr             = "10.20.40.64/26"
  function_support_autoscale_minimum = 2
  function_support_autoscale_maximum = 5
  function_support_autoscale_default = 2

  #issuer function app
  sign_issuer_snet_cidr             = "10.20.41.0/26"
  function_issuer_autoscale_minimum = 2
  function_issuer_autoscale_maximum = 5
  function_issuer_autoscale_default = 2

  #user function app
  sign_user_snet_cidr             = "10.20.42.0/26"
  function_user_autoscale_minimum = 2
  function_user_autoscale_maximum = 5
  function_user_autoscale_default = 2

  #backoffice function app
  sign_backoffice_snet_cidr             = "10.20.41.64/26"
  function_backoffice_autoscale_minimum = 2
  function_backoffice_autoscale_maximum = 5
  function_backoffice_autoscale_default = 2

  #backoffice app service
  sign_backoffice_app_snet_cidr = "10.20.42.64/26"
}