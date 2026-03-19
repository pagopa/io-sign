module "cosmosdb_sql_database_user" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_database?ref=v9.4.2"
  name                = "user"
  resource_group_name = azurerm_resource_group.data_rg.name
  account_name        = module.cosmosdb_account.name
}

module "cosmosdb_sql_container_user-signature-requests" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v9.4.2"
  name                = "signature-requests"
  resource_group_name = azurerm_resource_group.data_rg.name
  account_name        = module.cosmosdb_account.name
  database_name       = module.cosmosdb_sql_database_user.name
  partition_key_paths = ["/signerId"]

  autoscale_settings = {
    max_throughput = var.io_sign_database_user.signature_requests.max_throughput
  }

  default_ttl = var.io_sign_database_user.signature_requests.ttl
}

module "cosmosdb_sql_container_user-signatures" {
  source              = "github.com/pagopa/terraform-azurerm-v4//cosmosdb_sql_container?ref=v9.4.2"
  name                = "signatures"
  resource_group_name = azurerm_resource_group.data_rg.name
  account_name        = module.cosmosdb_account.name
  database_name       = module.cosmosdb_sql_database_user.name
  partition_key_paths = ["/signerId"]

  autoscale_settings = {
    max_throughput = var.io_sign_database_user.signatures.max_throughput
  }

  default_ttl = var.io_sign_database_user.signatures.ttl
}
