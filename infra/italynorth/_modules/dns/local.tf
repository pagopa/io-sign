locals {
  prefix           = "io"
  env_short        = "p"
  domain           = "sign"
  product          = format("%s-%s", local.prefix, local.env_short)
  project_weu_sign = format("%s-%s-%s", local.prefix, local.env_short, local.domain)

  integration_rg_name = format("%s-integration-rg", local.project_weu_sign)
  dns_zone_website    = "firma.io.pagopa.it"
  dns_default_ttl_sec = 3600

  dns_ses_validation = [
    {
      name   = "usgxww7qq2vgfzl4da6yv4qb4f7ls5kq._domainkey"
      record = "usgxww7qq2vgfzl4da6yv4qb4f7ls5kq.dkim.amazonses.com"
    },
    {
      name   = "e4m2laccz356yraixvndjtoivkwf4sc2._domainkey"
      record = "e4m2laccz356yraixvndjtoivkwf4sc2.dkim.amazonses.com"
    },
    {
      name   = "43al7wmot7uxzzz6dfq7fnkcqilx6q6l._domainkey"
      record = "43al7wmot7uxzzz6dfq7fnkcqilx6q6l.dkim.amazonses.com"
    },
  ]
}
