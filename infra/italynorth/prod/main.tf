module "function_sign_support" {
  source                             = "../_modules/support_function_app"
  vnet_common_name_itn               = local.vnet_common_name_itn
  common_resource_group_name_itn     = local.common_resource_group_name_itn
  sign_support_snet_cidr             = local.sign_support_snet_cidr
  function_support_autoscale_minimum = local.function_support_autoscale_minimum
  function_support_autoscale_maximum = local.function_support_autoscale_maximum
  function_support_autoscale_default = local.function_support_autoscale_default
  tags                               = local.tags
}

module "function_sign_issuer" {
  source                            = "../_modules/issuer_function_app"
  vnet_common_name_itn              = local.vnet_common_name_itn
  common_resource_group_name_itn    = local.common_resource_group_name_itn
  sign_issuer_snet_cidr             = local.sign_issuer_snet_cidr
  function_issuer_autoscale_minimum = local.function_issuer_autoscale_minimum
  function_issuer_autoscale_maximum = local.function_issuer_autoscale_maximum
  function_issuer_autoscale_default = local.function_issuer_autoscale_default
  tags                              = local.tags
}

module "function_sign_user" {
  source                          = "../_modules/user_function_app"
  vnet_common_name_itn            = local.vnet_common_name_itn
  common_resource_group_name_itn  = local.common_resource_group_name_itn
  sign_user_snet_cidr             = local.sign_user_snet_cidr
  function_user_autoscale_minimum = local.function_user_autoscale_minimum
  function_user_autoscale_maximum = local.function_user_autoscale_maximum
  function_user_autoscale_default = local.function_user_autoscale_default
  tags                            = local.tags
}

module "function_sign_backoffice" {
  source                                = "../_modules/backoffice_function_app"
  vnet_common_name_itn                  = local.vnet_common_name_itn
  common_resource_group_name_itn        = local.common_resource_group_name_itn
  sign_backoffice_snet_cidr             = local.sign_backoffice_snet_cidr
  function_backoffice_autoscale_minimum = local.function_backoffice_autoscale_minimum
  function_backoffice_autoscale_maximum = local.function_backoffice_autoscale_maximum
  function_backoffice_autoscale_default = local.function_backoffice_autoscale_default
  tags                                  = local.tags
}

module "itn_sign_backoffice_app" {
  source = "../_modules/backoffice_app_service"

  vnet_common_name_itn           = local.vnet_common_name_itn
  common_resource_group_name_itn = local.common_resource_group_name_itn
  sign_backoffice_app_snet_cidr  = local.sign_backoffice_app_snet_cidr
}

module "sign_key_vault" {
  source                         = "../_modules/key_vault"
  tags                           = local.tags
  vnet_common_name_itn           = local.vnet_common_name_itn
  common_resource_group_name_itn = local.common_resource_group_name_itn
  vault_private_dns_zone_id      = data.azurerm_private_dns_zone.key_vault.id
}

module "platform_proxy_api" {
  source = "../_modules/platform_proxy_api"

  platform_apim_name                  = data.azurerm_api_management.platform_apim.name
  platform_apim_resource_group_name   = data.azurerm_api_management.platform_apim.resource_group_name
  platform_apim_id                    = data.azurerm_api_management.platform_apim.id
  platform_apim_identity_principal_id = data.azurerm_api_management.platform_apim.identity[0].principal_id

  key_vault_common_name_itn         = module.sign_key_vault.name
  key_vault_resource_group_name_itn = module.sign_key_vault.resource_group_name
  key_vault_common_uri_itn          = module.sign_key_vault.vault_uri
  subscription_id                   = data.azurerm_subscription.current.subscription_id
}

module "cosmos_io_sign" {
  source = "../_modules/cosmos"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    domain          = local.domain
    app_name        = local.domain
    instance_number = local.instance_number
  }

  resource_group_name = local.cosmos_resource_group_name

  io_sign_database_issuer     = local.cosmos_io_sign_database_issuer
  io_sign_database_user       = local.cosmos_io_sign_database_user
  io_sign_database_backoffice = local.cosmos_io_sign_database_backoffice

  tags = local.tags
}

# =====================
# IMPORT: cosmos_io_sign
# =====================

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_account.cosmos_io_sign
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos"
}

import {
  to = module.cosmos_io_sign.azurerm_private_endpoint.cosmos_io_sign
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.Network/privateEndpoints/io-p-itn-sign-cosno-pep-01"
}

import {
  to = module.cosmos_io_sign.azurerm_private_endpoint.cosmos_io_sign_weu
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.Network/privateEndpoints/io-p-sign-cosmos"
}

# databases

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_database.issuer_database
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/issuer"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_database.user_database
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/user"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_database.backoffice_database
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/backoffice"
}

# containers: issuer

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.issuer_dossiers_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/issuer/containers/dossiers"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.issuer_signature_requests_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/issuer/containers/signature-requests"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.issuer_uploads_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/issuer/containers/uploads"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.issuer_issuers_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/issuer/containers/issuers"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.issuer_issuers_by_vat_number_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/issuer/containers/issuers-by-vat-number"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.issuer_issuers_by_subscription_id_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/issuer/containers/issuers-by-subscription-id"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.issuer_issuers_whitelist_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/issuer/containers/issuers-whitelist"
}

# containers: user

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.user_signature_requests_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/user/containers/signature-requests"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.user_signatures_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/user/containers/signatures"
}

# containers: backoffice

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.backoffice_api_keys_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/backoffice/containers/api-keys"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.backoffice_api_keys_by_id_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/backoffice/containers/api-keys-by-id"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.backoffice_issuers_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/backoffice/containers/issuers"
}

import {
  to = module.cosmos_io_sign.azurerm_cosmosdb_sql_container.backoffice_consents_container
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.DocumentDB/databaseAccounts/io-p-sign-cosmos/sqlDatabases/backoffice/containers/consents"
}
