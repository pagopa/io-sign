module "io_sign_snet_itn" {
  source               = "github.com/pagopa/terraform-azurerm-v3//subnet?ref=v8.35.0"
  name                 = format("%s-snet", local.project_itn_sign)
  resource_group_name  = data.azurerm_virtual_network.itn_vnet_common.resource_group_name
  virtual_network_name = data.azurerm_virtual_network.itn_vnet_common.name
  address_prefixes     = var.subnets_cidrs.issuer

  private_endpoint_network_policies_enabled = false

  # network_security_group_id = azurerm_network_security_group.io_sign_issuer_nsg.id

  service_endpoints = [
    "Microsoft.Web",
    "Microsoft.AzureCosmosDB",
    "Microsoft.Storage",
  ]

  delegation = {
    name = "default"
    service_delegation = {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_private_endpoint" "io_sign_issuer_func_itn" {
  name                = format("%s-issuer-func-pep-01", local.project_itn_sign)
  location            = azurerm_resource_group.data_rg_itn.location
  resource_group_name = azurerm_resource_group.data_rg_itn.name
  subnet_id           = data.azurerm_subnet.itn_private_endpoints_subnet.id

  private_service_connection {
    name                           = format("%s-issuer-func-pep-01", local.project_itn_sign)
    private_connection_resource_id = module.io_sign_issuer_func_itn.id
    is_manual_connection           = false
    subresource_names              = ["sites"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_azurewebsites_net.id]
  }

  tags = var.tags
}

resource "azurerm_private_endpoint" "io_sign_issuer_func_staging_itn" {
  count = var.io_sign_issuer_func.sku_tier == "PremiumV3" ? 1 : 0

  name                = format("%s-issuer-func-staging-pep-01", local.project_itn_sign)
  location            = azurerm_resource_group.data_rg_itn.location
  resource_group_name = azurerm_resource_group.data_rg_itn.name
  subnet_id           = data.azurerm_subnet.itn_private_endpoints_subnet.id

  private_service_connection {
    name                           = format("%s-issuer-func-staging-pep-01", local.project_itn_sign)
    private_connection_resource_id = module.io_sign_issuer_func_itn.id
    is_manual_connection           = false
    subresource_names              = ["sites-staging"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [data.azurerm_private_dns_zone.privatelink_azurewebsites_net.id]
  }

  tags = var.tags
}