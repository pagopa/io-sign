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
