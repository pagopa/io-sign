module "opex_identity_ci" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.34.2"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain
  app_name  = "opex"

  identity_role = "ci"

  github_federations = [
    {
      repository = "io-sign"
      subject    = github_repository_environment.github_repository_environment_opex_ci.environment
    }
  ]

  ci_rbac_roles = {
    subscription_roles = var.opex_environment_ci_roles.subscription
    resource_groups    = var.opex_environment_ci_roles.resource_groups
  }

  tags = var.tags
}

module "opex_identity_cd" {
  source = "github.com/pagopa/terraform-azurerm-v3//github_federated_identity?ref=v7.34.2"

  prefix    = var.prefix
  env_short = var.env_short
  domain    = var.domain
  app_name  = "opex"

  identity_role = "cd"

  github_federations = [
    {
      repository = "io-sign"
      subject    = github_repository_environment.github_repository_environment_opex_cd.environment
    }
  ]

  cd_rbac_roles = {
    subscription_roles = var.opex_environment_cd_roles.subscription
    resource_groups    = var.opex_environment_cd_roles.resource_groups
  }

  tags = var.tags
}
