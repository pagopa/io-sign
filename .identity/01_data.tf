data "azurerm_resource_group" "rg_identity" {
  name     = "${local.prefix}-identity-rg"
}

data "azurerm_resources" "web_apps" {
  resource_group_name = local.resource_group_name
  type                = "Microsoft.Web/sites"
}

data "azurerm_linux_web_app" "web_apps" {
  for_each            = local.web_apps_map
  resource_group_name = local.resource_group_name
  name                = each.value.name
}

data "github_team" "maintainers" {
  slug = "io-sign-maintainers"
}
