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

  queues = [
    {
      name      = "waiting-for-documents-to-fill"
      hasPoison = true
    },
    {
      name      = "on-signature-request-ready"
      hasPoison = true
    },
    {
      name      = "on-signature-request-wait-for-signature"
      hasPoison = true
    },
    {
      name      = "on-signature-request-rejected"
      hasPoison = true
    },
    {
      name      = "on-signature-request-signed"
      hasPoison = true
    },
    {
      name      = "waiting-for-qtsp"
      hasPoison = true
    },
    {
      name      = "waiting-for-signature-request-updates"
      hasPoison = true
    },
    {
      name      = "api-keys"
      hasPoison = true
    }
  ]
}