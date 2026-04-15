resource "azurerm_key_vault" "this" {
  name                          = "${local.prefix}-${local.env_short}-${local.location_short}-${local.domain}-kv-${local.instance_number}"
  location                      = local.location
  resource_group_name           = local.resource_group_name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "premium"
  soft_delete_retention_days    = 90
  enabled_for_disk_encryption   = true
  purge_protection_enabled      = true
  public_network_access_enabled = true

  network_acls {
    bypass         = "AzureServices"
    default_action = "Allow"
  }

  tags = var.tags
}

resource "azurerm_management_lock" "this" {
  name       = format("%s-lock", azurerm_key_vault.this.name)
  scope      = azurerm_key_vault.this.id
  lock_level = "CanNotDelete"
  notes      = "this items can't be deleted in this subscription!"
}


module "kv_roles_adgroup_admin" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azuread_group.adgroup_admin.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = module.key_vault.name
    resource_group_name = local.resource_group_name
    description         = "Allow adgroup-admin full access to Key Vault"
    roles = {
      secrets      = "owner"
      certificates = "owner"
      keys         = "owner"
    }
  }]
}

module "kv_roles_adgroup_developers" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azuread_group.adgroup_developers.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = module.key_vault.name
    resource_group_name = local.resource_group_name
    description         = "Allow adgroup-developers full access to Key Vault"
    roles = {
      secrets      = "owner"
      certificates = "owner"
      keys         = "owner"
    }
  }]
}

module "kv_roles_adgroup_sign" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azuread_group.adgroup_sign.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = module.key_vault.name
    resource_group_name = local.resource_group_name
    description         = "Allow adgroup-sign full access to Key Vault"
    roles = {
      secrets      = "owner"
      certificates = "owner"
      keys         = "owner"
    }
  }]
}

module "kv_roles_adgroup_ecosystem_n_links" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azuread_group.adgroup_ecosystem_n_links.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = module.key_vault.name
    resource_group_name = local.resource_group_name
    description         = "Allow adgroup-ecosystem-n-links full access to Key Vault"
    roles = {
      secrets      = "owner"
      certificates = "owner"
      keys         = "owner"
    }
  }]
}
