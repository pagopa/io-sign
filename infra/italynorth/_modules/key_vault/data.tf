data "azurerm_client_config" "current" {}

data "azurerm_subscription" "current" {}

data "azuread_group" "adgroup_admin" {
  display_name = format("%s-adgroup-admin", local.product)
}

data "azuread_group" "adgroup_developers" {
  display_name = format("%s-adgroup-developers", local.product)
}

data "azuread_group" "adgroup_sign" {
  display_name = format("%s-adgroup-sign", local.product)
}

data "azuread_group" "adgroup_ecosystem_n_links" {
  display_name = format("%s-adgroup-ecosystem-n-links-admins", local.product)
}
