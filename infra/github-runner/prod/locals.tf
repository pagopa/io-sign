locals {
  prefix    = "io"
  env_short = "p"

  tags = {
    CostCenter     = "TS310 - PAGAMENTI & SERVIZI"
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    Owner          = "IO"
    Source         = "https://github.com/pagopa/io-sign/infra/github-runner/prod"
  }
}
