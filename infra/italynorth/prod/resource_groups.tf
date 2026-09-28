# Moved from infra/resources/prod state, previously managed there
import {
  to = azurerm_resource_group.sign
  id = "/subscriptions/${data.azurerm_subscription.current.subscription_id}/resourceGroups/${format("%s-rg-01", local.project_itn_sign)}"
}

resource "azurerm_resource_group" "sign" {
  name     = format("%s-rg-01", local.project_itn_sign)
  location = local.location

  tags = local.tags
}

resource "azurerm_resource_group" "data_rg" {
  name     = format("%s-data-rg", local.project_weu_sign)
  location = "westeurope"

  tags = local.tags
}

# Needed to integrate Firma con IO with external domains, products or platforms (ie. eventhub for billing, ...)
resource "azurerm_resource_group" "integration_rg" {
  name     = format("%s-integration-rg", local.project_weu_sign)
  location = "westeurope"

  tags = local.tags
}
