# TODO: delete
resource "github_repository_environment" "github_repository_environment_opex" {
  environment = "${var.env}-opex"
  repository  = var.github.repository
  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment" "github_repository_environment_opex_ci" {
  environment = "opex-${var.env}-ci"
  repository  = var.github.repository
  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

resource "github_repository_environment" "github_repository_environment_opex_cd" {
  environment = "opex-${var.env}-cd"
  repository  = var.github.repository
  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
# resource "github_actions_environment_secret" "opex_azure_tenant_id" {
#   repository      = var.github.repository
#   environment     = "${var.env}-opex"
#   secret_name     = "AZURE_TENANT_ID"
#   plaintext_value = data.azurerm_client_config.current.tenant_id
# }

# #tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
# resource "github_actions_environment_secret" "opex_azure_subscription_id" {
#   repository      = var.github.repository
#   environment     = "${var.env}-opex"
#   secret_name     = "AZURE_SUBSCRIPTION_ID"
#   plaintext_value = data.azurerm_subscription.current.subscription_id
# }

# TODO: delete
#tfsec:ignore:github-actions-no-plain-text-action-secrets # not real secret
resource "github_actions_environment_secret" "opex_azure_client_id" {
  repository      = var.github.repository
  environment     = "${var.env}-opex"
  secret_name     = "AZURE_CLIENT_ID"
  plaintext_value = azurerm_user_assigned_identity.runner.client_id
}

resource "github_actions_environment_secret" "opex_env_ci_secrets" {
  for_each        = local.opex_env_ci_secrets
  repository      = var.github.repository
  environment     = github_repository_environment.github_repository_environment_opex_ci.environment
  secret_name     = each.key
  plaintext_value = each.value
}

resource "github_actions_environment_secret" "opex_env_cd_secrets" {
  for_each        = local.opex_env_cd_secrets
  repository      = var.github.repository
  environment     = github_repository_environment.github_repository_environment_opex_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# resource "github_actions_environment_secret" "opex_azure_client_id_ci" {
#   repository      = var.github.repository
#   environment     = github_repository_environment.github_repository_environment_opex_ci.environment
#   secret_name     = "AZURE_CLIENT_ID_CI"
#   plaintext_value = module.opex_identity_ci.client_id
# }

# resource "github_actions_environment_secret" "opex_azure_client_id_cd" {
#   repository      = var.github.repository
#   environment     = github_repository_environment.github_repository_environment_opex_cd.environment
#   secret_name     = "AZURE_CLIENT_ID_CD"
#   plaintext_value = module.opex_identity_cd.client_id
# }
