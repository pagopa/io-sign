data "azurerm_user_assigned_identity" "identity_prod_ci" {
  name                = "${local.project}-sign-github-ci-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_prod_cd" {
  name                = "${local.project}-sign-github-cd-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_opex_prod_ci" {
  name                = "${local.project}-sign-opex-github-ci-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_opex_prod_cd" {
  name                = "${local.project}-sign-opex-github-cd-identity"
  resource_group_name = local.identity_resource_group_name
}

data "azurerm_user_assigned_identity" "identity_app_prod_cd" {
  name                = "${local.project}-sign-app-github-cd-identity"
  resource_group_name = local.identity_resource_group_name
}

data "github_organization_teams" "all" {
  root_teams_only = true
  summary_only    = true
}

# Web app configuration
data "azurerm_resources" "web_apps" {
  resource_group_name = local.backend_resource_group_name
  type                = "Microsoft.Web/sites"
}

# data "azurerm_linux_web_app" "web_apps" {
#   for_each            = local.web_apps_map
#   resource_group_name = local.backend_resource_group_name
#   name                = each.value.name
# }