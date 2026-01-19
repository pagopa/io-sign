resource "azurerm_api_management_api_version_set" "io_sign_v1" {
  name                = "io_sign_v1"
  resource_group_name = var.platform_apim_resource_group_name
  api_management_name = var.platform_apim_name
  display_name        = "IO Sign Backend v1"
  versioning_scheme   = "Segment"
}

resource "azurerm_api_management_named_value" "app_backend_key" {
  name                = "io-sign-app-backend-key"
  api_management_name = var.platform_apim_name
  resource_group_name = var.platform_apim_resource_group_name
  display_name        = "io-sign-app-backend-key"
  value               = data.azurerm_key_vault_secret.app_backend_api_key_secret.value
  secret              = true
}

resource "azurerm_api_management_api" "io_sign" {
  name                  = "io-p-sign-api"
  api_management_name   = var.platform_apim_name
  resource_group_name   = var.platform_apim_resource_group_name
  subscription_required = false

  version_set_id = azurerm_api_management_api_version_set.io_sign_v1.id
  version        = "v1"
  revision       = "1"

  description  = "IO Sign Backend API"
  display_name = "IO Sign Backend"
  path         = "api/sign"
  protocols    = ["https"]

  import {
    content_format = "openapi-link"
    content_value  = "https://raw.githubusercontent.com/pagopa/io-backend/158cff2cf879a06fe1a5af218fc9adf5bda90681/openapi/generated/api_io_sign.yaml"
  }
}

resource "azurerm_api_management_product_api" "io_sign" {
  api_name            = azurerm_api_management_api.io_sign.name
  resource_group_name = var.platform_apim_resource_group_name
  api_management_name = var.platform_apim_name
  product_id          = data.azurerm_api_management_product.apim_platform_domain_product.product_id
}

resource "azurerm_api_management_api_policy" "io_sign" {
  api_name            = azurerm_api_management_api.io_sign.name
  api_management_name = var.platform_apim_name
  resource_group_name = var.platform_apim_resource_group_name

  xml_content = file("${path.module}/policies/io_sign/_api_base_policy.xml")
}

resource "azurerm_api_management_api_tag" "io_sign_api_tag" {
  api_id = azurerm_api_management_api.io_sign.id
  name   = azurerm_api_management_tag.io_sign_tag.name
}
