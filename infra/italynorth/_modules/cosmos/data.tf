data "azurerm_resource_group" "sign_weu_data_rg" {
  name = var.resource_group_name
}

data "azurerm_subnet" "private_endpoints_subnet_itn" {
  name                 = "io-p-itn-pep-snet-01"
  virtual_network_name = "${local.project_itn}-common-vnet-01"
  resource_group_name  = "${local.project_itn}-common-rg-01"
}

data "azurerm_resource_group" "weu_common" {
  name = "${local.prefix}-${local.env_short}-rg-common"
}

data "azurerm_private_dns_zone" "privatelink_documents_azure_com" {
  name                = "privatelink.documents.azure.com"
  resource_group_name = data.azurerm_resource_group.weu_common.name
}
