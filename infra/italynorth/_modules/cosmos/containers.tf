# =====================
# DATABASE: issuer
# =====================

resource "azurerm_cosmosdb_sql_database" "issuer_database" {
  name                = "issuer"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
}

resource "azurerm_cosmosdb_sql_container" "issuer_dossiers_container" {
  name                = "dossiers"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.issuer_database.name
  partition_key_paths = ["/issuerId"]
  default_ttl         = var.io_sign_database_issuer.dossiers.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_issuer.dossiers.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "issuer_signature_requests_container" {
  name                = "signature-requests"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.issuer_database.name
  partition_key_paths = ["/issuerId"]
  default_ttl         = var.io_sign_database_issuer.signature_requests.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_issuer.signature_requests.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "issuer_uploads_container" {
  name                = "uploads"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.issuer_database.name
  partition_key_paths = ["/id"]
  default_ttl         = var.io_sign_database_issuer.uploads.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_issuer.uploads.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "issuer_issuers_container" {
  name                = "issuers"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.issuer_database.name
  partition_key_paths = ["/subscriptionId"]
  default_ttl         = var.io_sign_database_issuer.issuers.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_issuer.issuers.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "issuer_issuers_by_vat_number_container" {
  name                = "issuers-by-vat-number"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.issuer_database.name
  partition_key_paths = ["/id"]
  default_ttl         = var.io_sign_database_issuer.issuers_by_vat_number.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_issuer.issuers_by_vat_number.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "issuer_issuers_by_subscription_id_container" {
  name                = "issuers-by-subscription-id"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.issuer_database.name
  partition_key_paths = ["/id"]
  default_ttl         = var.io_sign_database_issuer.issuers_by_subscription_id.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_issuer.issuers_by_subscription_id.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "issuer_issuers_whitelist_container" {
  name                = "issuers-whitelist"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.issuer_database.name
  partition_key_paths = ["/id"]
  default_ttl         = var.io_sign_database_issuer.issuers_whitelist.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_issuer.issuers_whitelist.max_throughput
  }
}

# =====================
# DATABASE: user
# =====================

resource "azurerm_cosmosdb_sql_database" "user_database" {
  name                = "user"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
}

resource "azurerm_cosmosdb_sql_container" "user_signature_requests_container" {
  name                = "signature-requests"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.user_database.name
  partition_key_paths = ["/signerId"]
  default_ttl         = var.io_sign_database_user.signature_requests.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_user.signature_requests.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "user_signatures_container" {
  name                = "signatures"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.user_database.name
  partition_key_paths = ["/signerId"]
  default_ttl         = var.io_sign_database_user.signatures.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_user.signatures.max_throughput
  }
}

# =====================
# DATABASE: backoffice
# =====================

resource "azurerm_cosmosdb_sql_database" "backoffice_database" {
  name                = "backoffice"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
}

resource "azurerm_cosmosdb_sql_container" "backoffice_api_keys_container" {
  name                = "api-keys"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.backoffice_database.name
  partition_key_paths = ["/institutionId"]
  default_ttl         = var.io_sign_database_backoffice.api_keys.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_backoffice.api_keys.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "backoffice_api_keys_by_id_container" {
  name                = "api-keys-by-id"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.backoffice_database.name
  partition_key_paths = ["/id"]
  default_ttl         = var.io_sign_database_backoffice.api_keys_by_id.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_backoffice.api_keys_by_id.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "backoffice_issuers_container" {
  name                = "issuers"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.backoffice_database.name
  partition_key_paths = ["/institutionId"]
  default_ttl         = var.io_sign_database_backoffice.issuers.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_backoffice.issuers.max_throughput
  }
}

resource "azurerm_cosmosdb_sql_container" "backoffice_consents_container" {
  name                = "consents"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = azurerm_cosmosdb_account.cosmos_io_sign.name
  database_name       = azurerm_cosmosdb_sql_database.backoffice_database.name
  partition_key_paths = ["/institutionId"]
  default_ttl         = var.io_sign_database_backoffice.consents.ttl

  autoscale_settings {
    max_throughput = var.io_sign_database_backoffice.consents.max_throughput
  }
}
