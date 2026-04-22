locals {
  prefix          = var.environment.prefix
  env_short       = var.environment.env_short
  location_itn    = var.environment.location
  domain          = var.environment.domain
  instance_number = var.environment.instance_number

  location_weu = "westeurope"

  project_itn = "${local.prefix}-${local.env_short}-itn"
  project_weu = "${local.prefix}-${local.env_short}"
}
