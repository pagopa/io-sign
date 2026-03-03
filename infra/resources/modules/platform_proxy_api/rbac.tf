resource "azurerm_role_assignment" "apim_key_vault_secrets_reader" {
  description          = "Allow ${var.platform_apim_name} to read secrets"
  principal_id         = var.platform_apim_identity_principal_id
  role_definition_name = "Key Vault Secrets User"
  scope                = var.key_vault_common_id
}