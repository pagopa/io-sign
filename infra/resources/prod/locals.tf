locals {
  project     = format("%s-%s-%s", var.prefix, var.env_short, var.domain)
  product     = format("%s-%s", var.prefix, var.env_short)
  project_itn = "${local.product}-itn"
}
###Italy North
locals {
  prefix = "io"
  env_short = "p"
  domain = "redis"
  instance_number = "01"
  itn_environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = var.location
    domain          = local.domain
    instance_number = local.instance_number
    }
}