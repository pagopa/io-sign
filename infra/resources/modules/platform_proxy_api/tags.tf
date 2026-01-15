resource "azurerm_api_management_tag" "io_sign_tag" {
  api_management_id = var.platform_apim_id
  name              = "IOSign"
}
