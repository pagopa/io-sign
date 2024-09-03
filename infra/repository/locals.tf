locals {
  project = "io-p"

  identity_resource_group_name = "${local.project}-identity-rg"
  backend_resource_group_name  = "${local.project}-sign-backend-rg"

  repo_secrets = {
    "ARM_TENANT_ID"       = data.azurerm_client_config.current.tenant_id,
    "ARM_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
  }

  ci = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_prod_ci.client_id
    }
  }

  cd = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_prod_cd.client_id
    }
    reviewers_teams = ["io-sign-admins", "io-sign-maintainers", "engineering-team-cloud-eng"]
  }

  # OPEX
  ci_opex = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_opex_prod_ci.client_id
    }
  }

  cd_opex = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_opex_prod_cd.client_id
    }
    reviewers_teams = ["io-sign-admins", "io-sign-maintainers", "engineering-team-cloud-eng"]
  }

  # WEB-APP
  # web_apps_map = { for w in data.azurerm_resources.web_apps.resources : w.name => w }

  cd_web_apps = {
    secrets = {
      "ARM_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_app_prod_cd.client_id
    }
    reviewers_teams = ["io-sign-admins", "io-sign-maintainers", "engineering-team-cloud-eng"]
  }
}
