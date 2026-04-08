variable "tags" {
  type = map(any)
  default = {
    CreatedBy = "Terraform"
  }
}

variable "vnet_common_name_itn" {
  type        = string
  description = "name of the common itn vnet"
}

variable "common_resource_group_name_itn" {
  type        = string
  description = "name of the common itn resource group"
}

variable "sign_backoffice_app_snet_cidr" {
  type        = string
  description = "Services Subnet CIDR"
}

