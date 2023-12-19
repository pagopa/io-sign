terraform {
  required_version = ">=1.6.0"

  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "2.33.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.75.0"
    }
    github = {
      source  = "integrations/github"
      version = "5.39.0"
    }
  }

  backend "azurerm" {}
}

provider "azurerm" {
  features {}
}

provider "github" {
  owner          = var.github.org
  write_delay_ms = "200"
  read_delay_ms  = "200"
}

data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}
