resource "azurerm_api_management_policy_fragment" "io_sign_user_data" {
  api_management_id = var.platform_apim_id
  name              = "io-sign-user-data"
  format            = "xml"
  value             = file("${path.module}/policies/io_sign/x_user_decompose.xml")
}
