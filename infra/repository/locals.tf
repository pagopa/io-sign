locals {
  project = "io-p"

  identity_resource_group_name = "${local.project}-identity-rg"
  backend_resource_group_name = "${local.project}-sign-backend-rg"

  repo_secrets = {
    "AZURE_TENANT_ID"       = data.azurerm_client_config.current.tenant_id,
    "AZURE_SUBSCRIPTION_ID" = data.azurerm_subscription.current.subscription_id
  }

  ci = {
    secrets = {
      "AZURE_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_prod_ci.client_id
    }
  }

  cd = {
    secrets = {
      "AZURE_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_prod_cd.client_id
    }
    reviewers_teams = ["io-backend-contributors", "io-backend-admin", "engineering-team-cloud-eng"]
  }

  # OPEX
  ci_opex = {
    secrets = {
      "AZURE_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_opex_prod_ci.client_id
    }
  }

  cd_opex = {
    secrets = {
      "AZURE_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_opex_prod_cd.client_id
    }
  }

  # WEB-APP
  web_apps_map = { for w in data.azurerm_resources.web_apps.resources : w.name => w }

  cd_web_apps = {
    secrets = {
      "AZURE_CLIENT_ID" = data.azurerm_user_assigned_identity.identity_app_prod_cd.client_id
    }
    reviewers_teams = ["io-backend-contributors", "io-backend-admin", "engineering-team-cloud-eng","io-sign-maintainers"]
  }
}
