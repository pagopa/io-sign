prefix    = "sign"
env_short = "p"
env       = "prod"

environment_ci_roles = {
  subscription = [
    "Reader",
    "Reader and Data Access",
    "Storage Blob Data Reader",
    "Storage File Data SMB Share Reader",
    "Storage Queue Data Reader",
    "Storage Table Data Reader",
    "PagoPA Export Deployments Template",
    "Key Vault Secrets User",
  ]
}

github_repository_environment_ci = {
  protected_branches     = false
  custom_branch_policies = true
}

environment_cd_roles = {
  subscription = [
    "Reader",
    "Website Contributor",
    "Storage Blob Data Contributor",
  ]
}

github_repository_environment_cd = {
  protected_branches     = true
  custom_branch_policies = false
  reviewers_teams        = ["io-sign-maintainers"]
}
