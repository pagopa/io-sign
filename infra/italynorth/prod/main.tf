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

module "function_sign_user_02" {
  source                             = "../_modules/user_function_app_02"
  vnet_common_name_itn               = local.vnet_common_name_itn
  common_resource_group_name_itn     = local.common_resource_group_name_itn
  sign_user_02_snet_cidr             = local.sign_user_02_snet_cidr
  function_user_02_autoscale_minimum = local.function_user_02_autoscale_minimum
  function_user_02_autoscale_maximum = local.function_user_02_autoscale_maximum
  function_user_02_autoscale_default = local.function_user_02_autoscale_default
  tags                               = local.tags
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

module "function_sign_events" {
  source                            = "../_modules/events_function_app"
  vnet_common_name_itn              = local.vnet_common_name_itn
  common_resource_group_name_itn    = local.common_resource_group_name_itn
  sign_events_snet_cidr             = local.sign_events_snet_cidr
  function_events_autoscale_minimum = local.function_events_autoscale_minimum
  function_events_autoscale_maximum = local.function_events_autoscale_maximum
  function_events_autoscale_default = local.function_events_autoscale_default
  tags                              = local.tags
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
  project_itn                       = local.project_itn
}


module "apim_itn" {
  source = "../_modules/apim_itn"

  apim_name                  = data.azurerm_api_management.apim_itn.name
  apim_resource_group_name   = data.azurerm_api_management.apim_itn.resource_group_name
  apim_identity_principal_id = data.azurerm_api_management.apim_itn.identity[0].principal_id
  subscription_id            = data.azurerm_subscription.current.subscription_id

  key_vault_name_itn                = module.sign_key_vault.name
  key_vault_resource_group_name_itn = module.sign_key_vault.resource_group_name
  key_vault_vault_uri_itn           = module.sign_key_vault.vault_uri

  project_itn = local.project_itn
  product     = local.product

  cosmosdb_account_name = data.azurerm_cosmosdb_account.sign_cosmos.name
}
module "monitoring" {
  source       = "../_modules/monitoring"
  key_vault_id = module.sign_key_vault.id
  tags         = local.tags
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

module "storage_io_sign" {
  source = "../_modules/storage"

  vnet_common_name_itn           = local.vnet_common_name_itn
  common_resource_group_name_itn = local.common_resource_group_name_itn

  tags = local.tags
}

module "event_hub" {
  source = "../_modules/event_hub"

  vnet_common_name_itn           = local.vnet_common_name_itn
  common_resource_group_name_itn = local.common_resource_group_name_itn

  tags = local.tags
}

module "dns" {
  source = "../_modules/dns"

  tags = local.tags
}

module "landing" {
  source = "../_modules/landing"

  tags = local.tags
}

# --- import blocks: migrate existing resources from westeurope state ---

locals {
  sub = "ec285037-c673-4f58-b594-d7c480da4e8b"
}

import {
  to = azurerm_resource_group.data_rg
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-data-rg"
}

import {
  to = azurerm_resource_group.integration_rg
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg"
}

import {
  to = module.dns.azurerm_dns_zone.firma_io_pagopa_it[0]
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg/providers/Microsoft.Network/dnsZones/firma.io.pagopa.it"
}

import {
  to = module.dns.azurerm_dns_mx_record.ses_mx_firma_io_pagopa_it
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg/providers/Microsoft.Network/dnsZones/firma.io.pagopa.it/MX/@"
}

import {
  to = module.dns.azurerm_dns_cname_record.ses_validation_firma_io_pagopa_it["usgxww7qq2vgfzl4da6yv4qb4f7ls5kq._domainkey"]
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg/providers/Microsoft.Network/dnsZones/firma.io.pagopa.it/CNAME/usgxww7qq2vgfzl4da6yv4qb4f7ls5kq._domainkey"
}

import {
  to = module.dns.azurerm_dns_cname_record.ses_validation_firma_io_pagopa_it["e4m2laccz356yraixvndjtoivkwf4sc2._domainkey"]
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg/providers/Microsoft.Network/dnsZones/firma.io.pagopa.it/CNAME/e4m2laccz356yraixvndjtoivkwf4sc2._domainkey"
}

import {
  to = module.dns.azurerm_dns_cname_record.ses_validation_firma_io_pagopa_it["43al7wmot7uxzzz6dfq7fnkcqilx6q6l._domainkey"]
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg/providers/Microsoft.Network/dnsZones/firma.io.pagopa.it/CNAME/43al7wmot7uxzzz6dfq7fnkcqilx6q6l._domainkey"
}

import {
  to = module.dns.azurerm_dns_txt_record.spf1_mailup_firma_io_pagopa_it
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg/providers/Microsoft.Network/dnsZones/firma.io.pagopa.it/TXT/@"
}

import {
  to = module.dns.azurerm_dns_cname_record.dkim1_mailup_firma_io_pagopa_it
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg/providers/Microsoft.Network/dnsZones/firma.io.pagopa.it/CNAME/ml01._domainkey"
}

import {
  to = module.dns.azurerm_dns_cname_record.dkim2_mailup_firma_io_pagopa_it
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg/providers/Microsoft.Network/dnsZones/firma.io.pagopa.it/CNAME/ml02._domainkey"
}

import {
  to = module.dns.azurerm_dns_txt_record.dmarc_mailup_firma_io_pagopa_it
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-sign-integration-rg/providers/Microsoft.Network/dnsZones/firma.io.pagopa.it/TXT/_dmarc"
}

import {
  to = module.landing.azurerm_dns_cname_record.cloudfront
  id = "/subscriptions/${local.sub}/resourceGroups/io-p-rg-external/providers/Microsoft.Network/dnsZones/io.italia.it/CNAME/firma"
}
