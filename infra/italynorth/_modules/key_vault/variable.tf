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

variable "vault_private_dns_zone_id" {
  type        = string
  description = "id of the key vault private dns zone"
}
