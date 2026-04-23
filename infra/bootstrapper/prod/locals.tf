locals {
  prefix          = "io"
  env_short       = "p"
  location        = "italynorth"
  domain          = "sign"
  instance_number = "01"
  weu_prefix      = "${local.prefix}-${local.env_short}"
  itn_prefix      = "${local.prefix}-${local.env_short}-itn"

  adgroups = {
    admins_name     = "io-p-adgroup-ecosystem-n-links-admins"
    devs_name       = "io-p-adgroup-ecosystem-n-links-developers"
    admin_name      = "io-p-adgroup-admin"
    developers_name = "io-p-adgroup-developers"
    sign_name       = "io-p-adgroup-sign"
  }

  runner = {
    cae_name                = "${local.itn_prefix}-github-runner-cae-01"
    cae_resource_group_name = "${local.itn_prefix}-github-runner-rg-01"
    secret = {
      kv_name                = "${local.itn_prefix}-common-kv-01"
      kv_resource_group_name = "${local.itn_prefix}-common-rg-01"
    }
  }

  apim = {
    name                = "${local.itn_prefix}-apim-01"
    resource_group_name = "${local.itn_prefix}-common-rg-01"
  }

  platform_apim = {
    name                = "${local.itn_prefix}-platform-api-gateway-apim-01"
    resource_group_name = "${local.itn_prefix}-common-rg-01"
  }

  vnet = {
    name                = "${local.itn_prefix}-common-vnet-01"
    resource_group_name = "${local.itn_prefix}-common-rg-01"
  }

  dns_zones = {
    resource_group_name = "${local.weu_prefix}-rg-common"
  }

  functions = {
    itn_io_sign_rg_name             = "${local.itn_prefix}-sign-rg-01"
    itn_io_sign_integration_rg_name = "${local.itn_prefix}-sign-integration-rg-01"
    itn_io_sign_data_rg_name        = "${local.itn_prefix}-sign-data-rg-01"
    io_p_sign_integration_rg_name   = "${local.weu_prefix}-sign-integration-rg"
    io_p_sign_data_rg_name          = "${local.weu_prefix}-sign-data-rg"
    io_p_sign_sec_rg_name           = "${local.weu_prefix}-sign-sec-rg"
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

  sign_key_vault = {
    name                = "io-p-sign-kv"
    resource_group_name = "io-p-sign-sec-rg"
  }

  sign_itn_key_vault = {
    name                = "${local.itn_prefix}-sign-kv-01"
    resource_group_name = "${local.itn_prefix}-sign-rg-01"
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
