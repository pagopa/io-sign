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

  # reviewers {
  #   teams = matchkeys(
  #     data.github_organization_teams.all.teams[*].id,
  #     data.github_organization_teams.all.teams[*].slug,
  #     local.cd_opex.reviewers_teams
  #   )
  # }
}

resource "github_actions_environment_secret" "env_opex_prod_cd_secrets" {
  for_each = local.cd_opex.secrets

  repository      = github_repository.this.name
  environment     = github_repository_environment.github_repository_environment_opex_prod_cd.environment
  secret_name     = each.key
  plaintext_value = each.value
}

# -------------- WEB-APP ----------------

resource "github_repository_environment" "web_apps" {
  for_each    = local.web_apps_map
  environment = each.value.name
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
  for_each        = local.web_apps_map
  repository      = github_repository.this.name
  environment     = github_repository_environment.web_apps[each.key].environment
  secret_name     = "AZURE_CLIENT_ID"
  plaintext_value = local.cd_web_apps.secrets["AZURE_CLIENT_ID"]
}

resource "github_actions_environment_variable" "web_app_resouce_group" {
  for_each      = local.web_apps_map
  repository    = github_repository.this.name
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_RESOURCE_GROUP"
  value         = local.backend_resource_group_name
}

resource "github_actions_environment_variable" "web_app_names" {
  for_each      = local.web_apps_map
  repository    = github_repository.this.name
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_NAME"
  value         = each.value.name
}

resource "github_actions_environment_variable" "health_check_path" {
  for_each      = local.web_apps_map
  repository    = github_repository.this.name
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "HEALTH_CHECK_PATH"
  value         = coalesce(data.azurerm_linux_web_app.web_apps[each.key].site_config[0].health_check_path, "/")
}
