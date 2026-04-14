data "azurerm_subscription" "current" {}

data "azuread_group" "adgroup_admin" {
  display_name = "io-p-adgroup-admin"
}

data "azuread_group" "adgroup_developers" {
  display_name = "io-p-adgroup-developers"
}

data "azuread_group" "adgroup_sign" {
  display_name = "io-p-adgroup-sign"
}

data "azuread_group" "adgroup_ecosystem_n_links" {
  display_name = "io-p-adgroup-ecosystem-n-links-admins"
}

data "azuread_service_principal" "platform_iac_sp" {
  display_name = format("pagopaspa-io-platform-iac-projects-%s", data.azurerm_subscription.current.subscription_id)
}
