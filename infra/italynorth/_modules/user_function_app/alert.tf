resource "azurerm_monitor_scheduled_query_rules_alert" "get_signature_request_not_found" {
  name                = "${local.project_itn_sign}-user-func-get-signature-request-not-found"
  resource_group_name = data.azurerm_resource_group.sign_itn_rg.name
  location            = local.location_itn

  data_source_id          = data.azurerm_application_insights.application_insights.id
  description             = "[IO-SIGN] getSignatureRequest returns 404 on io-p-itn-sign-user-func-01"
  enabled                 = true
  auto_mitigation_enabled = false

  query = <<-QUERY
requests
| where cloud_RoleName == "io-p-itn-sign-user-func-01"
| where name == "getSignatureRequest"
| where resultCode == "404"
| summarize AggregatedValue = count() by bin(timestamp, 30m)
  QUERY

  severity    = 2
  frequency   = 30
  time_window = 30

  trigger {
    operator  = "GreaterThanOrEqual"
    threshold = 10
  }

  action {
    action_group = [
      data.azurerm_monitor_action_group.common_error_action_group.id,
      data.azurerm_monitor_action_group.sign_error_action_group.id,
    ]
  }

  tags = var.tags
}
