resource "azurerm_api_management_product" "apim_platform_domain_product" {
  product_id   = "io-sign"
  display_name = "IO Sign"
  description  = "Product for IO Sign APIs"

  api_management_name = var.platform_apim_name
  resource_group_name = var.platform_apim_resource_group_name

  published             = true
  subscription_required = false
  approval_required     = false
}

resource "azurerm_api_management_product_policy" "apim_platform_domain_product_policy" {
  product_id          = azurerm_api_management_product.apim_platform_domain_product.product_id
  api_management_name = var.platform_apim_name
  resource_group_name = var.platform_apim_resource_group_name

  xml_content = file("${path.module}/policies/io_sign/_product_base_policy.xml")
}