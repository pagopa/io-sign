data "azurerm_resource_group" "rg_identity" {
  name     = "${local.prefix}-identity-rg"
}

# data "azurerm_resource_group" "environment_cd_resource_groups" {
#   for_each = toset([for rg, role_list in var.environment_cd_roles.resource_groups : rg])
#   name     = each.value
# }

# TODO: delete
data "azurerm_resource_group" "github_runner_rg" {
  name = "${var.prefix}-${var.env_short}-github-runner-rg"
}

# TODO: delete
data "azurerm_resource_group" "backend" {
  name = "${local.project}-backend-rg"
}

# TODO: delete
data "azurerm_resource_group" "dashboards" {
  name = "dashboards"
}

# TODO: delete
data "azurerm_storage_account" "tfstate_app" {
  name                = "tfapp${lower(replace(data.azurerm_subscription.current.display_name, "-", ""))}"
  resource_group_name = "terraform-state-rg"
}
