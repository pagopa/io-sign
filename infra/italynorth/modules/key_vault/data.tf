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

data "azurerm_user_assigned_identity" "infra_ci" {
  name                = "${local.product}-infra-github-ci-identity"
  resource_group_name = "${local.product}-identity-rg"
}

data "azurerm_user_assigned_identity" "infra_cd" {
  name                = "${local.product}-infra-github-cd-identity"
  resource_group_name = "${local.product}-identity-rg"
}

data "azuread_service_principal" "platform_iac_sp" {
  display_name = format("pagopaspa-io-platform-iac-projects-%s", data.azurerm_subscription.current.subscription_id)
}

data "azurerm_user_assigned_identity" "github_federated_ci" {
  name                = "${local.product}-${local.domain}-github-ci-identity"
  resource_group_name = "${local.product}-identity-rg"
}

data "azurerm_user_assigned_identity" "github_federated_cd" {
  name                = "${local.product}-${local.domain}-github-cd-identity"
  resource_group_name = "${local.product}-identity-rg"
}
