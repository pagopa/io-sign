module "apim_platform_roles" {
  source          = "pagopa-dx/azure-role-assignments/azurerm"
  version         = "~> 1.2.0"
  principal_id    = var.platform_apim_identity_principal_id
  subscription_id = var.subscription_id

  key_vault = [
    {
      name                = var.key_vault_common_name_itn
      resource_group_name = var.key_vault_resource_group_name_itn
      description         = "Allow ${var.platform_apim_name} to read secrets from ${var.key_vault_common_name_itn} with rbac"
      has_rbac_support    = true
      roles = {
        secrets = "reader"
      }
    }
  ]
}
