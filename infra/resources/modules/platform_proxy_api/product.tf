data "azurerm_api_management_product" "apim_platform_domain_product" {
  product_id          = "io-sign"
  api_management_name = var.platform_apim_name
  resource_group_name = var.platform_apim_resource_group_name
}
