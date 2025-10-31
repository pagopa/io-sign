
module "key_vault_itn" {
  source = "github.com/pagopa/terraform-azurerm-v3//key_vault?ref=v8.35.0"

  name                       = format("%s-kv", local.project_itn_sign)
  location                   = azurerm_resource_group.sec_rg_itn.location
  resource_group_name        = azurerm_resource_group.sec_rg_itn.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days = 90

  tags = var.tags
}

# module "key_vault_secrets_itn" {
#   source = "github.com/pagopa/terraform-azurerm-v3//key_vault_secrets_query?ref=v8.35.0"

#   resource_group = azurerm_resource_group.sec_rg_itn.name
#   key_vault_name = module.key_vault_itn.name

#   secrets = [
#     "IoServicesSubscriptionKey",
#     "io-fn-sign-issuer-key",
#     "io-fn-sign-support-key",
#     "NamirialPassword",
#     "NamirialTestPassword",
#     "SelfCareEventHubConnectionString",
#     "SelfCareApiKey",
#     "SlackWebhookUrl",
#     "LollipopPrimaryApiKey",
#     "LollipopSecondaryApiKey",
#     "PdvTokenizerApiKey",
#     "BackOfficeApiKey",
#     "io-services-configuration-id",
#     "io-sign-backoffice-func-key"
#   ]
# }

## adgroup_admin group policy ##
resource "azurerm_key_vault_access_policy" "adgroup_admin_itn" {
  key_vault_id = module.key_vault_itn.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azuread_group.adgroup_admin.object_id

  key_permissions         = ["Get", "List", "Update", "Create", "Import", "Delete", ]
  secret_permissions      = ["Get", "List", "Set", "Delete", "Restore", "Recover", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", "Update", "Create", "Import", "Delete", "Restore", "Recover", ]
}

## adgroup_developers group policy ##
resource "azurerm_key_vault_access_policy" "adgroup_developers_itn" {
  key_vault_id = module.key_vault_itn.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azuread_group.adgroup_developers.object_id

  key_permissions         = ["Get", "List", "Update", "Create", "Import", "Delete", ]
  secret_permissions      = ["Get", "List", "Set", "Delete", "Restore", "Recover", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", "Update", "Create", "Import", "Delete", "Restore", "Recover", ]
}

## adgroup_sign group policy ##
resource "azurerm_key_vault_access_policy" "adgroup_sign_itn" {
  key_vault_id = module.key_vault_itn.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azuread_group.adgroup_sign.object_id

  key_permissions         = ["Get", "List", "Update", "Create", "Import", "Delete", ]
  secret_permissions      = ["Get", "List", "Set", "Delete", "Restore", "Recover", ]
  storage_permissions     = []
  certificate_permissions = ["Get", "List", "Update", "Create", "Import", "Delete", "Restore", "Recover", ]
}

resource "azurerm_key_vault_access_policy" "infra_ci_itn" {
  key_vault_id = module.key_vault_itn.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azurerm_user_assigned_identity.infra_ci.principal_id

  secret_permissions = ["Get", "List"]
}

resource "azurerm_key_vault_access_policy" "infra_cd_itn" {
  key_vault_id = module.key_vault_itn.id

  tenant_id = data.azurerm_client_config.current.tenant_id
  object_id = data.azurerm_user_assigned_identity.infra_cd.principal_id

  secret_permissions = ["Get", "List", "Set"]
}

#
# azure devops policy
#

#pagopaspa-io-platform-iac-projects-{subscription}
data "azuread_service_principal" "platform_iac_sp_itn" {
  display_name = format("pagopaspa-io-platform-iac-projects-%s", data.azurerm_subscription.current.subscription_id)
}

resource "azurerm_key_vault_access_policy" "azdevops_platform_iac_policy_itn" {
  key_vault_id = module.key_vault_itn.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azuread_service_principal.platform_iac_sp_itn.object_id

  secret_permissions      = ["Get", "List", "Set", ]
  storage_permissions     = []
  certificate_permissions = ["SetIssuers", "DeleteIssuers", "Purge", "List", "Get", "ManageContacts", ]
}

data "azurerm_user_assigned_identity" "github_federated_ci" {
  name                = "${local.project}-github-ci-identity"
  resource_group_name = "${local.product}-identity-rg"
}

resource "azurerm_key_vault_access_policy" "github_ci_identity" {
  key_vault_id = module.key_vault_itn.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_user_assigned_identity.github_federated_ci.principal_id

  secret_permissions = ["Get", "List"]
}

data "azurerm_user_assigned_identity" "github_federated_cd" {
  name                = "${local.project}-github-cd-identity"
  resource_group_name = "${local.product}-identity-rg"
}

resource "azurerm_key_vault_access_policy" "github_cd_identity" {
  key_vault_id = module.key_vault_itn.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_user_assigned_identity.github_federated_cd.principal_id

  secret_permissions = ["Get", "List"]
}