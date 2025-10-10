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
