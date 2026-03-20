locals {
  prefix           = "io"
  env_short        = "p"
  location         = "italynorth"
  domain           = "sign"
  instance_number  = "01"
  project_weu_sign = format("%s-%s-%s", local.prefix, local.env_short, local.domain)
  project_itn      = "${local.prefix}-${local.env_short}-itn"
  project_itn_sign = format("%s-%s-itn-%s", local.prefix, local.env_short, local.domain)

  tags = {
    BusinessUnit = "App IO"
    CreatedBy    = "Terraform"
    Environment  = "Prod"
    Source       = "https://github.com/pagopa/io-infra/blob/main/src/domains/functions"
    CostCenter   = "TS000 - Tecnologia e Servizi"
  }
  vnet_common_name_itn               = "${local.project_itn}-common-vnet-01"
  common_resource_group_name_itn     = "${local.project_itn}-common-rg-01"
  sign_support_snet_cidr             = ""
  function_support_autoscale_minimum = 1
  function_support_autoscale_maximum = 5
  function_support_autoscale_default = 1
}