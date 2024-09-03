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

  continuos_integration = {
    enable = true
    roles = {
      subscription = [
        "Reader",
        "Reader and Data Access",
        "PagoPA IaC Reader",
        "DocumentDB Account Contributor",
        "Storage Blob Data Reader",
        "Storage File Data SMB Share Reader",
        "Storage Queue Data Reader",
        "Storage Table Data Reader",
        "Key Vault Reader",
      ]
      resource_groups = {
        terraform-state-rg = [
          "Storage Blob Data Contributor"
        ]
      }
    }
  }

  continuos_delivery = {
    enable = true
    roles = {
      subscription = [
        "Contributor",
        "Storage Account Contributor",
        "Storage Blob Data Contributor",
        "Storage File Data SMB Share Contributor",
        "Storage Queue Data Contributor",
        "Storage Table Data Contributor",
        "Key Vault Contributor",
      ]
      resource_groups = {}
    }
  }


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

# Access Policy
module "roles_ci" {
  source       = "github.com/pagopa/dx//infra/modules/azure_role_assignments?ref=main"
  principal_id = module.federated_identities.federated_ci_identity.id

  key_vault = [
    {
      name                = "io-p-sign-kv"
      resource_group_name = "io-p-sign-sec-rg"
      roles = {
        secrets = "reader"
      }
    }
  ]
}