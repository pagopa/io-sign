# Sign product

resource "azurerm_api_management_product" "io_sign" {
  product_id            = "io-sign-api"
  display_name          = "IO SIGN API"
  description           = "Product for IO sign"
  api_management_name   = var.apim_name
  resource_group_name   = var.apim_resource_group_name
  published             = true
  subscription_required = true
  approval_required     = false
}

resource "azurerm_api_management_product_policy" "io_sign" {
  product_id          = azurerm_api_management_product.io_sign.product_id
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  xml_content         = file("${path.module}/api_product/sign/_base_policy.xml")
}

resource "azurerm_api_management_api" "io_sign_issuer_v1" {
  name                  = format("%s-sign-issuer-api", var.product)
  api_management_name   = var.apim_name
  resource_group_name   = var.apim_resource_group_name
  revision              = "1"
  subscription_required = true

  description  = "IO Sign - Issuer API"
  display_name = "IO Sign - Issuer API"
  path         = "api/v1/sign"
  protocols    = ["https"]

  import {
    content_format = "openapi"
    content_value  = file("${path.module}/../../../../apps/io-func-sign-issuer/api/external.yaml")
  }
}

resource "azurerm_api_management_api_policy" "io_sign_issuer_v1" {
  api_name            = azurerm_api_management_api.io_sign_issuer_v1.name
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  xml_content         = file("${path.module}/api/issuer/v1/base_policy.xml")
}

resource "azurerm_api_management_product_api" "io_sign_issuer_v1" {
  api_name            = azurerm_api_management_api.io_sign_issuer_v1.name
  product_id          = azurerm_api_management_product.io_sign.product_id
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
}

resource "azurerm_api_management_api_operation_policy" "get_signer_by_fiscal_code_policy_itn" {
  api_name            = azurerm_api_management_api.io_sign_issuer_v1.name
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  operation_id        = "getSignerByFiscalCode"
  xml_content         = file("${path.module}/api/issuer/v1/get_signer_by_fiscal_code_policy/policy.xml")
}

# Operational product

resource "azurerm_api_management_product" "io_sign_operational" {
  product_id            = "io-sign-operational-api"
  display_name          = "IO Sign - Operational API"
  description           = "Operational APIs for IO Sign"
  api_management_name   = var.apim_name
  resource_group_name   = var.apim_resource_group_name
  published             = true
  subscription_required = true
  approval_required     = false
}

resource "azurerm_api_management_product_policy" "io_sign_operational" {
  product_id          = azurerm_api_management_product.io_sign_operational.product_id
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  xml_content         = file("${path.module}/api/base_policy.xml")
}

resource "azurerm_api_management_api" "io_sign_operational_v1" {
  name                  = format("%s-sign-operational-api", var.product)
  api_management_name   = var.apim_name
  resource_group_name   = var.apim_resource_group_name
  revision              = "1"
  subscription_required = true

  description  = "IO Sign - Operational API"
  display_name = "IO Sign - Operational API"
  path         = "api/v1/sign/operational"
  protocols    = ["https"]

  import {
    content_format = "openapi"
    content_value  = file("${path.module}/../../../../apps/io-func-sign-issuer/api/operational.yaml")
  }
}

resource "azurerm_api_management_api_policy" "io_sign_operational_v1" {
  api_name            = azurerm_api_management_api.io_sign_operational_v1.name
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  xml_content         = file("${path.module}/api/operational/v1/base_policy.xml")

  depends_on = [
    azurerm_api_management_named_value.io_fn_sign_issuer_url_itn,
    azurerm_api_management_named_value.io_fn_sign_issuer_key_itn
  ]
}

resource "azurerm_api_management_product_api" "io_sign_operational_v1" {
  api_name            = azurerm_api_management_api.io_sign_operational_v1.name
  product_id          = azurerm_api_management_product.io_sign_operational.product_id
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name

  depends_on = [
    azurerm_api_management_product_policy.io_sign_operational,
    azurerm_api_management_api_policy.io_sign_operational_v1
  ]
}

# Support product

resource "azurerm_api_management_product" "io_sign_support" {
  product_id            = "io-sign-support-api"
  display_name          = "IO SIGN SUPPORT Product"
  description           = "Support Product for IO SIGN"
  api_management_name   = var.apim_name
  resource_group_name   = var.apim_resource_group_name
  published             = true
  subscription_required = true
  approval_required     = false
}

resource "azurerm_api_management_product_policy" "io_sign_support" {
  product_id          = azurerm_api_management_product.io_sign_support.product_id
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  xml_content         = file("${path.module}/api_product/support/_base_policy.xml")
}

resource "azurerm_api_management_api" "io_sign_support_v1" {
  name                  = format("%s-sign-support-api", var.product)
  api_management_name   = var.apim_name
  resource_group_name   = var.apim_resource_group_name
  revision              = "1"
  subscription_required = true

  description  = "IO Sign - Support API"
  display_name = "IO Sign - Support API"
  path         = "api/v1/sign/support"
  protocols    = ["https"]

  import {
    content_format = "openapi"
    content_value  = file("${path.module}/api/support/v1/openapi.yaml")
  }
}

resource "azurerm_api_management_api_policy" "io_sign_support_v1" {
  api_name            = azurerm_api_management_api.io_sign_support_v1.name
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  xml_content         = file("${path.module}/api/support/v1/base_policy.xml")
}

resource "azurerm_api_management_product_api" "io_sign_support_v1" {
  api_name            = azurerm_api_management_api.io_sign_support_v1.name
  product_id          = azurerm_api_management_product.io_sign_support.product_id
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
}

# Backoffice product

resource "azurerm_api_management_product" "io_sign_backoffice" {
  product_id            = format("%s-sign-backoffice-apim-product", var.product)
  display_name          = "IO SIGN BACKOFFICE"
  description           = "Api Management product for io-sign-backoffice REST APIs"
  api_management_name   = var.apim_name
  resource_group_name   = var.apim_resource_group_name
  published             = true
  subscription_required = true
  approval_required     = false
}

resource "azurerm_api_management_product_policy" "io_sign_backoffice" {
  product_id          = azurerm_api_management_product.io_sign_backoffice.product_id
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  xml_content         = file("${path.module}/api_product/backoffice/_base_policy.xml")
}

resource "azurerm_api_management_api" "io_sign_backoffice_v1" {
  name                  = format("%s-sign-backoffice-apim-api", var.product)
  api_management_name   = var.apim_name
  resource_group_name   = var.apim_resource_group_name
  revision              = "1"
  subscription_required = true

  display_name = "IO SIGN BACKOFFICE API"
  description  = "io-sign-backoffice REST APIs"
  path         = "api/v1/sign/backoffice"
  protocols    = ["https"]

  import {
    content_format = "openapi"
    content_value  = file("${path.module}/../../../../apps/io-sign-backoffice-func/api/external.yaml")
  }
}

resource "azurerm_api_management_api_policy" "io_sign_backoffice_v1" {
  api_name            = azurerm_api_management_api.io_sign_backoffice_v1.name
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  xml_content         = file("${path.module}/api/backoffice/v1/base_policy.xml")
}

resource "azurerm_api_management_product_api" "io_sign_backoffice_v1" {
  api_name            = azurerm_api_management_api.io_sign_backoffice_v1.name
  product_id          = azurerm_api_management_product.io_sign_backoffice.product_id
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
}
