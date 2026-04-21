resource "azurerm_cosmosdb_account" "cosmos_io_sign" {
  name                = "${local.prefix}-${local.env_short}-${local.domain}-cosmos"
  location            = "westeurope"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  free_tier_enabled                 = true
  automatic_failover_enabled        = true
  is_virtual_network_filter_enabled = true

  geo_location {
    location          = "westeurope"
    failover_priority = 0
    zone_redundant    = false
  }

  geo_location {
    location          = "italynorth"
    failover_priority = 1
    zone_redundant    = true
  }

  public_network_access_enabled = false

  consistency_policy {
    consistency_level       = "BoundedStaleness"
    max_interval_in_seconds = 300
    max_staleness_prefix    = 100000
  }

  analytical_storage {
    schema_type = "WellDefined"
  }

  backup {
    type = "Continuous"
    tier = "Continuous30Days"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "cosmos_io_sign" {
  name                = "${local.prefix}-${local.env_short}-itn-${local.domain}-cosno-pep-${local.instance_number}"
  location            = local.location_itn
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  subnet_id           = data.azurerm_subnet.private_endpoints_subnet_itn.id

  private_service_connection {
    name                           = "${local.prefix}-${local.env_short}-itn-${local.domain}-cosno-pep-${local.instance_number}"
    private_connection_resource_id = azurerm_cosmosdb_account.cosmos_io_sign.id
    is_manual_connection           = false
    subresource_names              = ["Sql"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_documents_azure_com.id]
  }

  tags = var.tags
}
