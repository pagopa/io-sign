# =====================
# DATABASE: issuer
# =====================

module "issuer_database" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_database?ref=v7.20.0"
  name                = "issuer"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
}

module "issuer_dossiers_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "dossiers"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.issuer_database.name
  partition_key_paths = ["/issuerId"]
  autoscale_settings  = { max_throughput = var.io_sign_database_issuer.dossiers.max_throughput }
  default_ttl         = var.io_sign_database_issuer.dossiers.ttl
}

module "issuer_signature_requests_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "signature-requests"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.issuer_database.name
  partition_key_paths = ["/issuerId"]
  autoscale_settings  = { max_throughput = var.io_sign_database_issuer.signature_requests.max_throughput }
  default_ttl         = var.io_sign_database_issuer.signature_requests.ttl
}

module "issuer_uploads_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "uploads"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.issuer_database.name
  partition_key_paths = ["/id"]
  autoscale_settings  = { max_throughput = var.io_sign_database_issuer.uploads.max_throughput }
  default_ttl         = var.io_sign_database_issuer.uploads.ttl
}

module "issuer_issuers_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "issuers"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.issuer_database.name
  partition_key_paths = ["/subscriptionId"]
  autoscale_settings  = { max_throughput = var.io_sign_database_issuer.issuers.max_throughput }
  default_ttl         = var.io_sign_database_issuer.issuers.ttl
}

module "issuer_issuers_by_vat_number_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "issuers-by-vat-number"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.issuer_database.name
  partition_key_paths = ["/id"]
  autoscale_settings  = { max_throughput = var.io_sign_database_issuer.issuers_by_vat_number.max_throughput }
  default_ttl         = var.io_sign_database_issuer.issuers_by_vat_number.ttl
}

module "issuer_issuers_by_subscription_id_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "issuers-by-subscription-id"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.issuer_database.name
  partition_key_paths = ["/id"]
  autoscale_settings  = { max_throughput = var.io_sign_database_issuer.issuers_by_subscription_id.max_throughput }
  default_ttl         = var.io_sign_database_issuer.issuers_by_subscription_id.ttl
}

module "issuer_issuers_whitelist_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "issuers-whitelist"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.issuer_database.name
  partition_key_paths = ["/id"]
  autoscale_settings  = { max_throughput = var.io_sign_database_issuer.issuers_whitelist.max_throughput }
  default_ttl         = var.io_sign_database_issuer.issuers_whitelist.ttl
}

# =====================
# DATABASE: user
# =====================

module "user_database" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_database?ref=v7.20.0"
  name                = "user"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
}

module "user_signature_requests_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "signature-requests"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.user_database.name
  partition_key_paths = ["/signerId"]
  autoscale_settings  = { max_throughput = var.io_sign_database_user.signature_requests.max_throughput }
  default_ttl         = var.io_sign_database_user.signature_requests.ttl
}

module "user_signatures_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "signatures"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.user_database.name
  partition_key_paths = ["/signerId"]
  autoscale_settings  = { max_throughput = var.io_sign_database_user.signatures.max_throughput }
  default_ttl         = var.io_sign_database_user.signatures.ttl
}

# =====================
# DATABASE: backoffice
# =====================

module "backoffice_database" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_database?ref=v7.20.0"
  name                = "backoffice"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
}

module "backoffice_api_keys_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "api-keys"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.backoffice_database.name
  partition_key_paths = ["/institutionId"]
  autoscale_settings  = { max_throughput = var.io_sign_database_backoffice.api_keys.max_throughput }
  default_ttl         = var.io_sign_database_backoffice.api_keys.ttl
}

module "backoffice_api_keys_by_id_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "api-keys-by-id"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.backoffice_database.name
  partition_key_paths = ["/id"]
  autoscale_settings  = { max_throughput = var.io_sign_database_backoffice.api_keys_by_id.max_throughput }
  default_ttl         = var.io_sign_database_backoffice.api_keys_by_id.ttl
}

module "backoffice_issuers_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "issuers"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.backoffice_database.name
  partition_key_paths = ["/institutionId"]
  autoscale_settings  = { max_throughput = var.io_sign_database_backoffice.issuers.max_throughput }
  default_ttl         = var.io_sign_database_backoffice.issuers.ttl
}

module "backoffice_consents_container" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v7.20.0"
  name                = "consents"
  resource_group_name = data.azurerm_resource_group.sign_weu_data_rg.name
  account_name        = module.cosmos_io_sign.name
  database_name       = module.backoffice_database.name
  partition_key_paths = ["/institutionId"]
  autoscale_settings  = { max_throughput = var.io_sign_database_backoffice.consents.max_throughput }
  default_ttl         = var.io_sign_database_backoffice.consents.ttl
}
