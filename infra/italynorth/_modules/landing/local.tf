locals {
  prefix    = "io"
  env_short = "p"
  product   = format("%s-%s", local.prefix, local.env_short)

  landing_cdn_url = "d1z4jrsc2tpogm.cloudfront.net"
}
