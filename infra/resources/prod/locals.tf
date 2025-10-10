locals {
  project          = format("%s-%s-%s", var.prefix, var.env_short, var.domain)
  product          = format("%s-%s", var.prefix, var.env_short)
  project_itn      = "${local.product}-itn"
  project_itn_sign = format("%s-%s-itn-%s", var.prefix, var.env_short, var.domain)
}
