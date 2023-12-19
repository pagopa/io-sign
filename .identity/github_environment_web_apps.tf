resource "github_repository_environment" "web_apps" {
  for_each    = local.web_apps_map
  environment = each.value.name
  repository  = var.github.repository
  reviewers {
    teams = [data.github_team.maintainers.id]
  }
}

resource "github_actions_environment_secret" "web_app_client_id" {
  for_each        = local.web_apps_map
  repository      = var.github.repository
  environment     = github_repository_environment.web_apps[each.key].environment
  secret_name     = "AZURE_CLIENT_ID"
  plaintext_value = module.web_apps_identity_cd.identity_client_id
}

resource "github_actions_environment_variable" "web_app_resouce_group" {
  for_each      = local.web_apps_map
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_RESOURCE_GROUP"
  value         = local.resource_group_name
}

resource "github_actions_environment_variable" "web_app_names" {
  for_each      = local.web_apps_map
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "AZURE_WEB_APP_NAME"
  value         = each.value.name
}

resource "github_actions_environment_variable" "health_check_path" {
  for_each      = local.web_apps_map
  repository    = var.github.repository
  environment   = github_repository_environment.web_apps[each.key].environment
  variable_name = "HEALTH_CHECK_PATH"
  value         = coalesce(data.azurerm_linux_web_app.web_apps[each.key].site_config[0].health_check_path, "/")
}
