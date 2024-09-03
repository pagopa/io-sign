resource "github_repository_environment" "github_repository_environment_prod_cd" {
  environment = "prod-cd"
  repository  = github_repository.this.name

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }

  reviewers {
    teams = matchkeys(
      data.github_organization_teams.all.teams[*].id,
      data.github_organization_teams.all.teams[*].slug,
      local.cd.reviewers_teams
    )
  }
}

resource "github_actions_environment_secret" "env_prod_cd_secrets" {
  for_each = local.cd.secrets

  repository      = github_repository.this.name
  environment     = github_repository_environment.github_repository_environment_prod_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# -------------- OPEX ----------------

resource "github_repository_environment" "github_repository_environment_opex_prod_cd" {
  environment = "opex-prod-cd"
  repository  = github_repository.this.name

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
  reviewers {
    teams = matchkeys(
      data.github_organization_teams.all.teams[*].id,
      data.github_organization_teams.all.teams[*].slug,
      local.cd_opex.reviewers_teams
    )
  }
}

resource "github_actions_environment_secret" "env_opex_prod_cd_secrets" {
  for_each = local.cd_opex.secrets

  repository      = github_repository.this.name
  environment     = github_repository_environment.github_repository_environment_opex_prod_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# -------------- WEB-APP ----------------

resource "github_repository_environment" "github_repository_environment_web_apps_cd" {
  environment = "app-prod-cd"
  repository  = github_repository.this.name

  reviewers {
    teams = matchkeys(
      data.github_organization_teams.all.teams[*].id,
      data.github_organization_teams.all.teams[*].slug,
      local.cd_web_apps.reviewers_teams
    )
  }
}

resource "github_actions_environment_secret" "web_app_client_id" {
  for_each = local.cd_web_apps.secrets

  repository      = github_repository.this.name
  environment     = github_repository_environment.github_repository_environment_web_apps_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}