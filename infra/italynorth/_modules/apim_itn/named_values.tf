# Named values

resource "azurerm_api_management_named_value" "io_fn_sign_issuer_url_itn" {
  name                = "io-fn-sign-issuer-url"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-fn-sign-issuer-url"
  value               = format("https://%s-sign-issuer-func-01.azurewebsites.net", var.project_itn)
}

resource "azurerm_api_management_named_value" "io_fn_sign_issuer_key_itn" {
  name                = "io-fn-sign-issuer-key"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-fn-sign-issuer-key"
  secret              = true
  value_from_key_vault {
    secret_id = "${var.key_vault_vault_uri_itn}secrets/io-fn-sign-issuer-key"
  }
}

resource "azurerm_api_management_named_value" "io_fn_sign_support_url_itn" {
  name                = "io-fn-sign-support-url"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-fn-sign-support-url"
  value               = format("https://%s-sign-support-func-01.azurewebsites.net", var.project_itn)
}

resource "azurerm_api_management_named_value" "io_fn_sign_support_key_itn" {
  name                = "io-fn-sign-support-key"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-fn-sign-support-key"
  secret              = true
  value_from_key_vault {
    secret_id = "${var.key_vault_vault_uri_itn}secrets/io-fn-sign-support-key"
  }
}

resource "azurerm_api_management_named_value" "io_sign_cosmosdb_name_itn" {
  name                = "io-sign-cosmosdb-name"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-sign-cosmosdb-name"
  value               = var.cosmosdb_account_name
  secret              = false
}

resource "azurerm_api_management_named_value" "io_sign_cosmosdb_key_itn" {
  name                = "io-sign-cosmosdb-key"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-sign-cosmosdb-key"
  secret              = true
  value_from_key_vault {
    secret_id = "${var.key_vault_vault_uri_itn}secrets/COSMOS-DB-PRIMARY-KEY"
  }
}

# legacy, it can be removed once the backoffice is released
resource "azurerm_api_management_named_value" "io_sign_cosmosdb_issuer_container_name_itn" {
  name                = "io-sign-cosmosdb-issuer-container-name"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-sign-cosmosdb-issuer-container-name"
  value               = var.cosmosdb_sql_database_issuer_name
  secret              = false
}

resource "azurerm_api_management_named_value" "io_sign_cosmosdb_issuer_whitelist_collection_name_new_itn" {
  name                = "io-sign-cosmosdb-issuer-whitelist-collection-name"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-sign-cosmosdb-issuer-whitelist-collection-name"
  value               = var.cosmosdb_sql_container_issuer_issuers_whitelist_name
  secret              = false
}

resource "azurerm_api_management_named_value" "io_sign_cosmosdb_issuer_issuers_collection_name_itn" {
  name                = "io-sign-cosmosdb-issuer-issuers-name"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-sign-cosmosdb-issuer-issuers-name"
  value               = var.cosmosdb_sql_container_issuer_issuers_name
  secret              = false
}
# end legacy

resource "azurerm_api_management_named_value" "backoffice_database_name_itn" {
  name                = "io-sign-backoffice-database-name"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-sign-backoffice-database-name"
  value               = var.cosmosdb_sql_database_backoffice_name
  secret              = false
}

resource "azurerm_api_management_named_value" "backoffice_api_keys_collection_name_itn" {
  name                = "io-sign-backoffice-api-keys-collection-name"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-sign-backoffice-api-keys-collection-name"
  value               = var.cosmosdb_sql_container_backoffice_api_keys_name
  secret              = false
}

# BACK OFFICE

resource "azurerm_api_management_named_value" "io_fn_sign_backoffice_url_itn" {
  name                = "io-fn-sign-backoffice-url"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-fn-sign-backoffice-url"
  value               = format("https://%s-sign-bo-func-01.azurewebsites.net", var.project_itn)
}

resource "azurerm_api_management_named_value" "io_fn_sign_backoffice_key_itn" {
  name                = "io-fn-sign-backoffice-key"
  api_management_name = var.apim_name
  resource_group_name = var.apim_resource_group_name
  display_name        = "io-fn-sign-backoffice-key"
  secret              = true
  value_from_key_vault {
    secret_id = "${var.key_vault_vault_uri_itn}secrets/io-sign-backoffice-func-key"
  }
}
