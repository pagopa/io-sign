locals {
  prefix           = "io"
  env_short        = "p"
  location_short   = "itn"
  location         = "italynorth"
  domain           = "sign"
  instance_number  = "01"
  product          = format("%s-%s", local.prefix, local.env_short)
  project_itn_sign = format("%s-%s-itn-%s", local.prefix, local.env_short, local.domain)

  resource_group_name = format("%s-rg-%s", local.project_itn_sign, local.instance_number)

}
