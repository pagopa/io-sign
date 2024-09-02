terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "<= 3.108.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfappprodio"
    container_name       = "terraform-state"
    key                  = "io-sign.identity.tfstate"
  }
}

provider "azurerm" {
  features {
  }
}

module "federated_identities" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix    = local.prefix
  env_short = local.env_short
  env       = local.env
  domain    = local.domain

  repositories = [local.repo_name]

  tags = local.tags
}

module "federated_identities_web_apps" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix    = local.prefix
  env_short = local.env_short
  env       = "app-${local.env}"
  domain    = "${local.domain}-app"

  repositories = [local.repo_name]
  continuos_integration = {
    enable = false
  }

  continuos_delivery = {
    enable = true

    roles = {
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
  }

  tags = local.tags
}

module "federated_identities_opex" {
  source = "github.com/pagopa/dx//infra/modules/azure_federated_identity_with_github?ref=main"

  prefix    = local.prefix
  env_short = local.env_short
  env       = "opex-${local.env}"
  domain    = "${local.domain}-opex"

  repositories = [local.repo_name]
  continuos_integration = {
    enable = true

    roles = {
      subscription = []
      resource_groups = {
        dashboards = [
          "Reader"
        ]
        terraform-state-rg = [
          "Storage Blob Data Reader",
          "Reader and Data Access"
        ]
      }
    }
  }

  continuos_delivery = {
    enable = true

    roles = {
      subscription = []
      resource_groups = {
        dashboards = [
          "Contributor"
        ]
        terraform-state-rg = [
          "Storage Blob Data Contributor",
          "Reader and Data Access"
        ]
      }
    }
  }

  tags = local.tags
}