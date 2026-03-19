locals {
  prefix          = "io"
  env_short       = "p"
  location        = "italynorth"
  domain          = "sign"
  instance_number = "01"
  itn_prefix      = "${local.prefix}-${local.env_short}-itn"

  adgroups = {
    admins_name = "io-p-adgroup-ecosystem-n-links-admins"
    devs_name   = "io-p-adgroup-ecosystem-n-links-developers"
  }

  runner = {
    cae_name                = "${local.itn_prefix}-github-runner-cae-01"
    cae_resource_group_name = "${local.itn_prefix}-github-runner-rg-01"
    secret = {
      kv_name                = "${local.itn_prefix}-kv-common"
      kv_resource_group_name = "${local.itn_prefix}-rg-common"
    }
  }

  apim = {
    name                = "${local.itn_prefix}-apim-01"
    resource_group_name = "${local.itn_prefix}-common-rg-01"
  }

  vnet = {
    name                = "${local.itn_prefix}-common-vnet-01"
    resource_group_name = "${local.itn_prefix}-common-rg-01"
  }

  dns_zones = {
    resource_group_name = "${local.itn_prefix}-rg-common"
  }

  functions = {
    itn_io_sign_rg_name             = "${local.itn_prefix}-sign-rg-01"
    itn_io_sign_backend_rg_name     = "${local.itn_prefix}-sign-backend-rg-01"
    itn_io_sign_integration_rg_name = "${local.itn_prefix}-sign-integration-rg-01"
    itn_io_sign_data_rg_name        = "${local.itn_prefix}-sign-data-rg-01"
  }

  tf_storage_account = {
    name                = "iopitntfst001"
    resource_group_name = "terraform-state-rg"
  }

  repository = {
    name = "io-sign"
  }

  key_vault = {
    name                = "io-p-kv-common"
    resource_group_name = "io-p-rg-common"
  }

  tags = {
    CreatedBy      = "Terraform"
    Environment    = "Prod"
    BusinessUnit   = "App IO"
    ManagementTeam = "IO Ecosystem Links"
    CostCenter     = "TS000 - Tecnologia e Servizi"
    Source         = "https://github.com/pagopa/io-sign/blob/main/infra/bootstrapper/prod"
  }
}