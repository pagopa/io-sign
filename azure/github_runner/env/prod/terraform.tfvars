env_short = "p"
location = "westeurope"
prefix = "io"

tags = {
  CreatedBy   = "Terraform"
  Environment = "Prod"
  Owner       = "IO"
  Source      = "https://github.com/pagopa/io-sign"
  CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
}

key_vault_common = {
  resource_group_name = "io-p-rg-common"
  name                = "io-p-kv-common"
  pat_secret_name     = "github-runner-pat"
}

container_app_environment = {
  name                = "io-p-github-runner-cae"
  resource_group_name = "io-p-github-runner-rg"
}