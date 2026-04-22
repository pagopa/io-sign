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


module "apim_itn" {
  source = "../_modules/apim_itn"

  apim_name                  = data.azurerm_api_management.apim_itn.name
  apim_resource_group_name   = data.azurerm_api_management.apim_itn.resource_group_name
  apim_identity_principal_id = data.azurerm_api_management.apim_itn.identity[0].principal_id
  subscription_id            = data.azurerm_subscription.current.subscription_id

  key_vault_name                = data.azurerm_key_vault.sign_weu_kv.name
  key_vault_resource_group_name = data.azurerm_key_vault.sign_weu_kv.resource_group_name
  key_vault_vault_uri           = data.azurerm_key_vault.sign_weu_kv.vault_uri

  project_itn = local.project_itn
  product     = local.product

  cosmosdb_account_name = data.azurerm_cosmosdb_account.sign_cosmos.name
}

# ======================
# IMPORT: apim_itn
# ======================

locals {
  apim_itn_id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-itn-common-rg-01/providers/Microsoft.ApiManagement/service/io-p-itn-apim-01"
  kv_sign_id  = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-sec-rg/providers/Microsoft.KeyVault/vaults/io-p-sign-kv"
}

# named values

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_fn_sign_issuer_url_itn
  id = "${local.apim_itn_id}/namedValues/io-fn-sign-issuer-url"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_fn_sign_issuer_key_itn
  id = "${local.apim_itn_id}/namedValues/io-fn-sign-issuer-key"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_fn_sign_support_url_itn
  id = "${local.apim_itn_id}/namedValues/io-fn-sign-support-url"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_fn_sign_support_key_itn
  id = "${local.apim_itn_id}/namedValues/io-fn-sign-support-key"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_sign_cosmosdb_name_itn
  id = "${local.apim_itn_id}/namedValues/io-sign-cosmosdb-name"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_sign_cosmosdb_key_itn
  id = "${local.apim_itn_id}/namedValues/io-sign-cosmosdb-key"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_sign_cosmosdb_issuer_container_name_itn
  id = "${local.apim_itn_id}/namedValues/io-sign-cosmosdb-issuer-container-name"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_sign_cosmosdb_issuer_whitelist_collection_name_new_itn
  id = "${local.apim_itn_id}/namedValues/io-sign-cosmosdb-issuer-whitelist-collection-name"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_sign_cosmosdb_issuer_issuers_collection_name_itn
  id = "${local.apim_itn_id}/namedValues/io-sign-cosmosdb-issuer-issuers-name"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.backoffice_database_name_itn
  id = "${local.apim_itn_id}/namedValues/io-sign-backoffice-database-name"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.backoffice_api_keys_collection_name_itn
  id = "${local.apim_itn_id}/namedValues/io-sign-backoffice-api-keys-collection-name"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_fn_sign_backoffice_url_itn
  id = "${local.apim_itn_id}/namedValues/io-fn-sign-backoffice-url"
}

import {
  to = module.apim_itn.azurerm_api_management_named_value.io_fn_sign_backoffice_key_itn
  id = "${local.apim_itn_id}/namedValues/io-fn-sign-backoffice-key"
}

# products

import {
  to = module.apim_itn.azurerm_api_management_product.io_sign
  id = "${local.apim_itn_id}/products/io-sign-api"
}

import {
  to = module.apim_itn.azurerm_api_management_product_policy.io_sign
  id = "${local.apim_itn_id}/products/io-sign-api"
}

import {
  to = module.apim_itn.azurerm_api_management_product.io_sign_support
  id = "${local.apim_itn_id}/products/io-sign-support-api"
}

import {
  to = module.apim_itn.azurerm_api_management_product_policy.io_sign_support
  id = "${local.apim_itn_id}/products/io-sign-support-api"
}

import {
  to = module.apim_itn.azurerm_api_management_product.io_sign_backoffice
  id = "${local.apim_itn_id}/products/io-p-sign-backoffice-apim-product"
}

import {
  to = module.apim_itn.azurerm_api_management_product_policy.io_sign_backoffice
  id = "${local.apim_itn_id}/products/io-p-sign-backoffice-apim-product"
}

# apis

import {
  to = module.apim_itn.azurerm_api_management_api.io_sign_issuer_v1
  id = "${local.apim_itn_id}/apis/io-p-sign-issuer-api;rev=1"
}

import {
  to = module.apim_itn.azurerm_api_management_api_policy.io_sign_issuer_v1
  id = "${local.apim_itn_id}/apis/io-p-sign-issuer-api"
}

import {
  to = module.apim_itn.azurerm_api_management_product_api.io_sign_issuer_v1
  id = "${local.apim_itn_id}/products/io-sign-api/apis/io-p-sign-issuer-api"
}

import {
  to = module.apim_itn.azurerm_api_management_api_operation_policy.get_signer_by_fiscal_code_policy_itn
  id = "${local.apim_itn_id}/apis/io-p-sign-issuer-api/operations/getSignerByFiscalCode"
}

import {
  to = module.apim_itn.azurerm_api_management_api.io_sign_support_v1
  id = "${local.apim_itn_id}/apis/io-p-sign-support-api;rev=1"
}

import {
  to = module.apim_itn.azurerm_api_management_api_policy.io_sign_support_v1
  id = "${local.apim_itn_id}/apis/io-p-sign-support-api"
}

import {
  to = module.apim_itn.azurerm_api_management_product_api.io_sign_support_v1
  id = "${local.apim_itn_id}/products/io-sign-support-api/apis/io-p-sign-support-api"
}

import {
  to = module.apim_itn.azurerm_api_management_api.io_sign_backoffice_v1
  id = "${local.apim_itn_id}/apis/io-p-sign-backoffice-apim-api;rev=1"
}

import {
  to = module.apim_itn.azurerm_api_management_api_policy.io_sign_backoffice_v1
  id = "${local.apim_itn_id}/apis/io-p-sign-backoffice-apim-api"
}

import {
  to = module.apim_itn.azurerm_api_management_product_api.io_sign_backoffice_v1
  id = "${local.apim_itn_id}/products/io-p-sign-backoffice-apim-product/apis/io-p-sign-backoffice-apim-api"
}

# key vault access policy

import {
  to = module.apim_itn.module.apim_itn_roles.module.key_vault.azurerm_key_vault_access_policy.this["io-p-sign-sec-rg|io-p-sign-kv|reader||"]
  id = "${local.kv_sign_id}/objectId/bef9fb72-7a41-44d1-9819-2f0b5020bad6"
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

import {
  to = module.cosmos_io_sign.azurerm_monitor_metric_alert.cosmos_provisioned_throughput_exceeded
  id = "/subscriptions/ec285037-c673-4f58-b594-d7c480da4e8b/resourceGroups/io-p-sign-data-rg/providers/Microsoft.Insights/metricAlerts/[sign | io-p-sign-cosmos] Provisioned Throughput Exceeded"
}
