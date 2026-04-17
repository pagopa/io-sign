module "cosmos_io_sign" {
  source  = "pagopa-dx/azure-cosmos-account/azurerm"
  version = "~> 0.4"

  environment         = var.environment
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name

  subnet_pep_id                        = data.azurerm_subnet.private_endpoints_subnet_itn.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.weu_common.name

  primary_geo_location = {
    location       = "westeurope"
    zone_redundant = false
  }

  secondary_geo_locations = [
    {
      location          = "italynorth"
      failover_priority = 1
      zone_redundant    = true
    }
  ]

  force_public_network_access_enabled = false

  consistency_policy = {
    consistency_preset      = "Custom"
    consistency_level       = "BoundedStaleness"
    max_interval_in_seconds = 300
    max_staleness_prefix    = 100000
  }

  alerts = {
    enabled = false
  }

  tags = var.tags
}
