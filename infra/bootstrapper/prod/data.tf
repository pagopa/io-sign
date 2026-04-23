data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}

data "azurerm_container_app_environment" "runner" {
  name                = local.runner.cae_name
  resource_group_name = local.runner.cae_resource_group_name
}

data "azurerm_api_management" "apim" {
  name                = local.apim.name
  resource_group_name = local.apim.resource_group_name
}

data "azurerm_key_vault" "common" {
  name                = local.key_vault.name
  resource_group_name = local.key_vault.resource_group_name
}

data "azurerm_key_vault" "sign" {
  name                = local.sign_key_vault.name
  resource_group_name = local.sign_key_vault.resource_group_name
}

data "azurerm_virtual_network" "common" {
  name                = local.vnet.name
  resource_group_name = local.vnet.resource_group_name
}

data "azurerm_resource_group" "dns_zones" {
  name = local.dns_zones.resource_group_name
}

data "azurerm_resource_group" "dashboards" {
  name = "dashboards"
}

data "azurerm_resource_group" "common_itn" {
  name = "${local.prefix}-${local.env_short}-itn-common-rg-01"
}

data "azuread_group" "admins" {
  display_name = local.adgroups.admins_name
}

data "azuread_group" "developers" {
  display_name = local.adgroups.devs_name
}

data "azuread_group" "adgroup_admin" {
  display_name = local.adgroups.admin_name
}

data "azuread_group" "adgroup_developers" {
  display_name = local.adgroups.developers_name
}

data "azuread_group" "adgroup_sign" {
  display_name = local.adgroups.sign_name
}

data "azuread_group" "adgroup_ecosystem_n_links" {
  display_name = local.adgroups.admins_name
}

data "azurerm_key_vault" "sign_itn" {
  name                = local.sign_itn_key_vault.name
  resource_group_name = local.sign_itn_key_vault.resource_group_name
}

data "azurerm_resource_group" "sign_itn_rg" {
  name = local.functions.itn_io_sign_rg_name
}

data "azurerm_resource_group" "sign_itn_integration_rg" {
  name = local.functions.itn_io_sign_integration_rg_name
}

data "azurerm_resource_group" "sign_itn_data_rg" {
  name = local.functions.itn_io_sign_data_rg_name
}

data "azurerm_resource_group" "io_p_sign_backend_rg" {
  name = local.functions.io_p_sign_backend_rg_name
}

data "azurerm_resource_group" "io_p_sign_integration_rg" {
  name = local.functions.io_p_sign_integration_rg_name
}

data "azurerm_resource_group" "io_p_sign_data_rg" {
  name = local.functions.io_p_sign_data_rg_name
}

data "azurerm_resource_group" "io_p_sign_sec_rg" {
  name = local.functions.io_p_sign_sec_rg_name
}