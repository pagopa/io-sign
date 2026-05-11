locals {
  prefix           = "io"
  env_short        = "p"
  location_itn     = "italynorth"
  domain           = "sign"
  instance_number  = "01"
  project_weu_sign = format("%s-%s-%s", local.prefix, local.env_short, local.domain)
  product          = format("%s-%s", local.prefix, local.env_short)
  project_itn      = "${local.product}-itn"
  project_itn_sign = format("%s-%s-itn-%s", local.prefix, local.env_short, local.domain)

  ip_rules = [
    "18.192.147.151", # PDND-DATALAKE
    "18.159.227.69",  # PDND-DATALAKE
    "3.126.198.129"   # PDND-DATALAKE
  ]

  hubs = [
    {
      name                   = "billing"
      partitions             = 3
      message_retention_days = 7
      consumers              = []
      keys = [
        {
          name   = "io-sign-func-issuer"
          listen = false
          send   = true
          manage = false
        },
        {
          name   = "pdnd-invoicing"
          listen = true
          send   = false
          manage = false
        }
      ]
    },
    {
      name                   = "analytics"
      partitions             = 3
      message_retention_days = 7
      consumers              = []
      keys = [
        {
          name   = "io-sign-func-user"
          listen = false
          send   = true
          manage = false
        },
        {
          name   = "io-sign-func-issuer"
          listen = false
          send   = true
          manage = false
        },
        {
          name   = "pdnd-invoicing"
          listen = true
          send   = false
          manage = false
        }
      ]
    }
  ]
}