resource "azuread_directory_role" "directory_readers" {
  display_name = "Directory Readers"
}

data "azurerm_storage_account" "tfstate_inf" {
  name                = "iopsigninfrast"
  resource_group_name = "io-p-sign-infra-rg"
}

data "github_organization_teams" "all" {
  root_teams_only = true
  summary_only    = true
}
