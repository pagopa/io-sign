domain    = "sign"
env       = "prod"
env_short = "p"
prefix    = "io"

environment_cd_roles = {
  subscription = [
    "Reader",
  ]
  resource_groups = {
    io-p-sign-backend-rg = [
      "Website Contributor",
    ]
  }
}

github_repository_environment_cd = {
  protected_branches     = true
  custom_branch_policies = false
  reviewers_teams        = ["io-sign-maintainers"]
}
