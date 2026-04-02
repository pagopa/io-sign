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
        CreatedBy      = "Terraform"
        Environment    = "Prod"
        Owner          = "IO"
        Source         = "https://github.com/pagopa/io-sign",
        ManagementTeam = "IO Ecosystem - Links",
        CostCenter     = "TS000 - Tecnologia e Servizi"
    }
}