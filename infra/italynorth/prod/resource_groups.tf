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
