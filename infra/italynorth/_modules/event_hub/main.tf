module "eventhub" {
  source  = "pagopa-dx/azure-event-hub/azurerm"
  version = "~> 0.2"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location_itn
    app_name        = local.domain
    instance_number = local.instance_number
  }

  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name

  allowed_sources = {
    subnet_ids = []
    ips        = local.ip_rules
  }

  subnet_pep_id                        = data.azurerm_subnet.private_endpoints_subnet_itn.id
  private_dns_zone_resource_group_name = data.azurerm_resource_group.evt_rg.name

  eventhubs = local.hubs

  action_group_id = data.azurerm_monitor_action_group.common_error_action_group.id
  metric_alerts = {
    no_trx = {
      aggregation = "Total"
      metric_name = "IncomingMessages"
      description = "No transactions received from acquirer in the last 24h"
      operator    = "LessThanOrEqual"
      threshold   = 1000
      frequency   = "PT1H"
      window_size = "P1D"
    },
    active_connections = {
      aggregation = "Average"
      metric_name = "ActiveConnections"
      description = null
      operator    = "LessThanOrEqual"
      threshold   = 0
      frequency   = "PT5M"
      window_size = "PT15M"
    },
    error_trx = {
      aggregation = "Total"
      metric_name = "ServerErrors"
      description = "Server errors on io-sign Event Hub (ITN). Check immediately."
      operator    = "GreaterThan"
      threshold   = 0
      frequency   = "PT5M"
      window_size = "PT15M"
    },
  }

  use_case = "default"

  tags = var.tags
}
