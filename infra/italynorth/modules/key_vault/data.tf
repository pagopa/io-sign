data "azurerm_client_config" "current" {}

data "azurerm_subscription" "current" {}

data "azurerm_user_assigned_identity" "infra_ci" {
  name                = "${local.product}-infra-github-ci-identity"
  resource_group_name = "${local.product}-identity-rg"
}

data "azurerm_user_assigned_identity" "infra_cd" {
  name                = "${local.product}-infra-github-cd-identity"
  resource_group_name = "${local.product}-identity-rg"
}

data "azurerm_user_assigned_identity" "github_federated_ci" {
  name                = "${local.product}-${local.domain}-github-ci-identity"
  resource_group_name = "${local.product}-identity-rg"
}

data "azurerm_user_assigned_identity" "github_federated_cd" {
  name                = "${local.product}-${local.domain}-github-cd-identity"
  resource_group_name = "${local.product}-identity-rg"
}
