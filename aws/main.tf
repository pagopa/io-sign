terraform {
  required_version = "~> 1.3.0"

  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = var.tags
  }
}

data "aws_caller_identity" "current" {}
data "aws_default_tags" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

locals {
  aws_account_id   = data.aws_caller_identity.current.account_id
  aws_default_tags = data.aws_default_tags.current.tags
  aws_partition    = data.aws_partition.current.partition
  aws_region       = data.aws_region.current.name
  aws_url_suffix   = data.aws_partition.current.dns_suffix
}
