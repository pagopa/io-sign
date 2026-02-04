terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.114"
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
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "0.0.4"

  prefix    = local.prefix
  env_short = local.env_short
  env       = local.env
  domain    = local.domain
  location  = "westeurope"

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
        "User Access Administrator"
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
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "0.0.4"

  prefix    = local.prefix
  env_short = local.env_short
  env       = "app-${local.env}"
  domain    = "${local.domain}-app"
  location  = "westeurope"

  repositories = [local.repo_name]
  continuos_integration = {
    enable = true
    roles = {
      subscription = ["Reader"]
      resource_groups = {
        "io-p-sign-backend-rg" = [
          "PagoPA IaC Reader", "PagoPA Static Web Apps List Secrets",
        ],
        "io-p-itn-sign-backend-rg-01" = [
          "PagoPA IaC Reader", "PagoPA Static Web Apps List Secrets",
        ],
      }
    }
  }

  continuos_delivery = {
    enable = true

    roles = {
      subscription = []
      resource_groups = {
        "io-p-itn-sign-backend-rg-01" = [
          "Contributor", "Website Contributor", "CDN Profile Contributor", "Container Apps Contributor", "Storage Blob Data Contributor", "PagoPA Static Web Apps List Secrets"
        ],
        "io-p-sign-backend-rg" = [
          "Contributor", "Website Contributor", "CDN Profile Contributor", "Container Apps Contributor", "Storage Blob Data Contributor", "PagoPA Static Web Apps List Secrets"
        ]
      }
    }
  }

  tags = local.tags
}

module "federated_identities_opex" {
  source  = "pagopa-dx/azure-federated-identity-with-github/azurerm"
  version = "0.0.4"

  prefix    = local.prefix
  env_short = local.env_short
  env       = "opex-${local.env}"
  domain    = "${local.domain}-opex"
  location  = "westeurope"

  repositories = [local.repo_name]
  continuos_integration = {
    enable = true

    roles = {
      subscription = []
      resource_groups = {
        dashboards = [
          "Reader"
        ]
        io-p-rg-common = [
          "Reader"
        ]
        io-p-sign-integration-rg = [
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
        io-p-rg-common = [
          "Contributor"
        ]
        io-p-sign-integration-rg = [
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
  source       = "pagopa-dx/azure-role-assignments/azurerm"
  version      = "0.1.3"
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