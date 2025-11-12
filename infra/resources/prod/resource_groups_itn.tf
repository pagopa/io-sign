resource "azurerm_resource_group" "data_rg_itn" {
  name     = format("%s-data-rg-01", local.project_itn_sign)
  location = var.location_itn

  tags = var.tags
}

resource "azurerm_resource_group" "backend_rg_itn" {
  name     = format("%s-backend-rg-01", local.project_itn_sign)
  location = var.location_itn

  tags = var.tags
}

resource "azurerm_resource_group" "sec_rg_itn" {
  name     = format("%s-sec-rg-01", local.project_itn_sign)
  location = var.location_itn

  tags = var.tags
}

# Needed to integrate Firma con IO with external domains, products or platforms (ie. eventhub for billing, ...)
resource "azurerm_resource_group" "integration_rg_itn" {
  name     = format("%s-integration-rg-01", local.project_itn_sign)
  location = var.location_itn

  tags = var.tags
}
