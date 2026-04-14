module "key_vault" {
  source = "github.com/pagopa/terraform-azurerm-v4.git//key_vault?ref=v10.1.0"

  name                       = "${local.prefix}-${local.env_short}-${local.location_short}-${local.domain}-kv-${local.instance_number}"
  location                   = local.location
  resource_group_name        = local.resource_group_name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days = 90
  sku_name                   = "premium"

  enable_rbac_authorization = true

  lock_enable = true

  tags = var.tags
}


module "kv_roles_adgroup_admin" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = var.adgroup_admin_object_id
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
  principal_id    = var.adgroup_developers_object_id
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
  principal_id    = var.adgroup_sign_object_id
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
  principal_id    = var.adgroup_ecosystem_n_links_object_id
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

module "kv_roles_infra_ci" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azurerm_user_assigned_identity.infra_ci.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = module.key_vault.name
    resource_group_name = local.resource_group_name
    description         = "Allow infra CI identity to read secrets from Key Vault"
    roles = {
      secrets = "reader"
    }
  }]
}

module "kv_roles_infra_cd" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azurerm_user_assigned_identity.infra_cd.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = module.key_vault.name
    resource_group_name = local.resource_group_name
    description         = "Allow infra CD identity to read and write secrets to Key Vault"
    roles = {
      secrets = "writer"
    }
  }]
}

module "kv_roles_azdevops_platform_iac" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = var.platform_iac_sp_object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = module.key_vault.name
    resource_group_name = local.resource_group_name
    description         = "Allow Azure DevOps platform IAC service principal to manage secrets and certificates"
    roles = {
      secrets      = "writer"
      certificates = "owner"
    }
  }]
}

module "kv_roles_github_ci" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azurerm_user_assigned_identity.github_federated_ci.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = module.key_vault.name
    resource_group_name = local.resource_group_name
    description         = "Allow GitHub CI federated identity to read secrets from Key Vault"
    roles = {
      secrets = "reader"
    }
  }]
}

module "kv_roles_github_cd" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = data.azurerm_user_assigned_identity.github_federated_cd.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = module.key_vault.name
    resource_group_name = local.resource_group_name
    description         = "Allow GitHub CD federated identity to read secrets from Key Vault"
    roles = {
      secrets = "reader"
    }
  }]
}
