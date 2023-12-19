domain    = "sign"
env       = "prod"
env_short = "p"
prefix    = "io"

tags = {
  CreatedBy   = "Terraform"
  Environment = "Prod"
  Owner       = "io"
  Source      = "https://github.com/pagopa/io-sign"
  CostCenter  = "TS310 - PAGAMENTI & SERVIZI"
}

opex_environment_ci_roles = {
  subscription = ["Reader"]
  resource_groups = {
    "dashboards" = [
      "Reader"
    ],
    "terraform-state-rg" = [
      "Storage Blob Data Reader"
    ]
  }
}

opex_environment_cd_roles = {
  subscription = ["Reader"]
  resource_groups = {
    "dashboards" = [
      "Contributor"
    ],
    "terraform-state-rg" = [
      "Storage Blob Data Contributor"
    ]
  }
}

web_apps_environment_cd_roles = {
  subscription = []
  resource_groups = {
    "io-p-github-runner-rg" = [
      "Contributor",
    ],
    "io-p-sign-backend-rg" = [
      "Contributor",
    ]
  }
}

github_repository_environment_cd = {
  reviewers_teams = ["io-sign-maintainers"]
}
