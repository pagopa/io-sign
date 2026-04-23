module "bootstrap" {
  source  = "pagopa-dx/azure-github-environment-bootstrap/azurerm"
  version = "~> 3.0"

  environment = {
    prefix          = local.prefix
    env_short       = local.env_short
    location        = local.location
    domain          = local.domain
    instance_number = local.instance_number
  }

  additional_resource_group_ids = [
    data.azurerm_resource_group.sign_itn_rg.id,
    data.azurerm_resource_group.sign_itn_integration_rg.id,
    data.azurerm_resource_group.sign_itn_data_rg.id,
    data.azurerm_resource_group.io_p_sign_data_rg.id,
    data.azurerm_resource_group.io_p_sign_integration_rg.id,
    data.azurerm_resource_group.io_p_sign_sec_rg.id
  ]

  subscription_id = data.azurerm_subscription.current.id
  tenant_id       = data.azurerm_client_config.current.tenant_id

  entraid_groups = {
    admins_object_id = data.azuread_group.admins.object_id
    devs_object_id   = data.azuread_group.developers.object_id
  }

  terraform_storage_account = {
    name                = local.tf_storage_account.name
    resource_group_name = local.tf_storage_account.resource_group_name
  }

  repository = {
    owner = "pagopa"
    name  = local.repository.name
  }

  github_private_runner = {
    container_app_environment_id       = data.azurerm_container_app_environment.runner.id
    container_app_environment_location = data.azurerm_container_app_environment.runner.location
    use_github_app                     = true

    key_vault = {
      name                = local.runner.secret.kv_name
      resource_group_name = local.runner.secret.kv_resource_group_name
      use_rbac            = true
    }
  }

  apim_id                            = data.azurerm_api_management.apim.id
  pep_vnet_id                        = data.azurerm_virtual_network.common.id
  private_dns_zone_resource_group_id = data.azurerm_resource_group.dns_zones.id
  opex_resource_group_id             = data.azurerm_resource_group.dashboards.id
  keyvault_common_ids = [
    data.azurerm_key_vault.common.id
  ]

  nat_gateway_resource_group_id = data.azurerm_resource_group.common_itn.id

  tags = local.tags
}

module "roles_ci" {
  source  = "pagopa-dx/azure-role-assignments/azurerm"
  version = "~> 1.0"

  principal_id    = module.bootstrap.identities.infra.ci.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [
    {
      name                = "io-p-sign-kv"
      resource_group_name = "io-p-sign-sec-rg"
      description         = "Key Vault access for IO Sign"

      roles = {
        secrets = "reader"
      }
    }
  ]
}

resource "azurerm_role_assignment" "infra_cd_weu_kv_contributor" {
  scope                = data.azurerm_key_vault.sign.id
  role_definition_name = "Key Vault Contributor"
  principal_id         = module.bootstrap.identities.infra.cd.principal_id
}

module "roles_cd_platform_apim" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2"
  principal_id    = module.bootstrap.identities.infra.cd.principal_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  apim = [
    {
      name                = local.platform_apim.name
      resource_group_name = local.platform_apim.resource_group_name
      role                = "owner"
      description         = "Allow io-sign Infra CD identity to manage APIs on the platform APIM"
    }
  ]
}

module "kv_roles_adgroup_admin" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2"
  principal_id    = data.azuread_group.adgroup_admin.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = data.azurerm_key_vault.sign_itn.name
    resource_group_name = local.sign_itn_key_vault.resource_group_name
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
  version         = "~> 1.2"
  principal_id    = data.azuread_group.adgroup_developers.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = data.azurerm_key_vault.sign_itn.name
    resource_group_name = local.sign_itn_key_vault.resource_group_name
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
  version         = "~> 1.2"
  principal_id    = data.azuread_group.adgroup_sign.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = data.azurerm_key_vault.sign_itn.name
    resource_group_name = local.sign_itn_key_vault.resource_group_name
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
  version         = "~> 1.2"
  principal_id    = data.azuread_group.adgroup_ecosystem_n_links.object_id
  subscription_id = data.azurerm_subscription.current.subscription_id

  key_vault = [{
    name                = data.azurerm_key_vault.sign_itn.name
    resource_group_name = local.sign_itn_key_vault.resource_group_name
    description         = "Allow adgroup-ecosystem-n-links full access to Key Vault"
    roles = {
      secrets      = "owner"
      certificates = "owner"
      keys         = "owner"
    }
  }]
}
