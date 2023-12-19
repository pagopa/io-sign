# resource "github_actions_secret" "tenant_id" {
#   repository      = var.github.repository
#   secret_name     = "AZURE_TENANT_ID"
#   plaintext_value = data.azurerm_client_config.current.tenant_id
# }

# resource "github_actions_secret" "subscription_id" {
#   repository      = var.github.repository
#   secret_name     = "AZURE_SUBSCRIPTION_ID"
#   plaintext_value = data.azurerm_client_config.current.subscription_id
# }

resource "github_actions_secret" "repo_secrets" {
  for_each        = local.repo_secrets
  repository      = var.github.repository
  secret_name     = each.key
  plaintext_value = each.value
}