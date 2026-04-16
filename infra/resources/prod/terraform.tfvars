prefix       = "io"
env_short    = "p"
domain       = "sign"
location     = "westeurope"
location_itn = "italynorth"

tags = {
  CreatedBy      = "Terraform"
  ManagementTeam = "IO Firma"
  BusinessUnit   = "App IO"
  Environment    = "Prod"
  Source         = "https://github.com/pagopa/io-sign/blob/main/infra/resources/prod"
  CostCenter     = "TS000 - Tecnologia e Servizi"
}

# Container App Job GitHub Runner
key_vault_common = {
  resource_group_name = "io-p-rg-common"
  name                = "io-p-kv-common"
  pat_secret_name     = "github-runner-pat"
}

# You can retrieve the list of current defined subnets using the CLI command
# az network vnet subnet list --subscription PROD-IO --vnet-name io-p-vnet-common --resource-group io-p-rg-common --output table
# and thus define new CIDRs according to the unallocated address space
subnets_cidrs = {
  issuer     = ["10.0.102.0/24"]
  user       = ["10.0.103.0/24"]
  eventhub   = ["10.0.104.0/24"],
  support    = ["10.0.147.0/24"]
  backoffice = ["10.0.115.0/24"]
}

subnets_cidrs_itn = {
  issuer     = ["10.20.17.0/24"]
  user       = ["10.20.1.0/24"]
  support    = ["10.20.38.0/24"]
  backoffice = ["10.20.39.0/24"]
}

storage_account = {
  enable_versioning             = true
  change_feed_enabled           = true
  delete_after_days             = 90
  replication_type              = "GZRS"
  enable_low_availability_alert = true
}

cosmos = {
  zone_redundant = false
  additional_geo_locations = [
    {
      location          = "italynorth"
      failover_priority = 1
      zone_redundant    = true
    }
  ]
}

io_sign_database_issuer = {
  dossiers = {
    max_throughput = 1000
    ttl            = null
  }
  signature_requests = {
    max_throughput = 1000
    ttl            = null
  }
  uploads = {
    max_throughput = 1000
    ttl            = 604800
  }
  issuers = {
    max_throughput = 1000
    ttl            = null
  }
}

io_sign_database_user = {
  signature_requests = {
    max_throughput = 1000
    ttl            = null
  }
  signatures = {
    max_throughput = 1000
    ttl            = null
  }
}

io_sign_database_backoffice = {
  api_keys = {
    max_throughput = 1000
    ttl            = null
  }
  api_keys_by_id = {
    max_throughput = 1000
    ttl            = null
  }
  issuers = {
    max_throughput = 1000
    ttl            = null
  }
  consents = {
    max_throughput = 1000
    ttl            = null
  }
}

io_sign_issuer_func = {
  sku_tier          = "PremiumV3"
  sku_size          = "P1v3"
  autoscale_default = 1
  autoscale_minimum = 1
  autoscale_maximum = 5
}

io_sign_user_func = {
  sku_tier          = "PremiumV3"
  sku_size          = "P1v3"
  autoscale_default = 1
  autoscale_minimum = 1
  autoscale_maximum = 5
}

integration_hub = {
  auto_inflate_enabled     = true
  sku_name                 = "Standard"
  capacity                 = 1
  maximum_throughput_units = 5
  zone_redundant           = true
  alerts_enabled           = true
  ip_rules = [
    {
      ip_mask = "18.192.147.151", # PDND-DATALAKE
      action  = "Allow"
    },
    {
      ip_mask = "18.159.227.69", # PDND-DATALAKE
      action  = "Allow"
    },
    {
      ip_mask = "3.126.198.129", # PDND-DATALAKE
      action  = "Allow"
    }
  ]
  hubs = [
    {
      name              = "billing"
      partitions        = 3
      message_retention = 7
      consumers         = []
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
      name              = "analytics"
      partitions        = 3
      message_retention = 7
      consumers         = []
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

# DNS

dns_zone_names = {
  website = "firma.io.pagopa.it"
}

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

io_common = {
  resource_group_name          = "io-p-rg-common"
  log_analytics_workspace_name = "io-p-law-common"
  appgateway_snet_name         = "io-p-appgateway-snet"
  vnet_common_name             = "io-p-vnet-common"
}

landing_cdn_url = "d1z4jrsc2tpogm.cloudfront.net"