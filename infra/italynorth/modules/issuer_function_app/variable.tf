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

variable "sign_issuer_snet_cidr" {
  type        = string
  description = "Services Subnet CIDR"
}

variable "function_issuer_autoscale_minimum" {
  type        = number
  description = "The minimum number of instances for this resource."
  default     = 1
}

variable "function_issuer_autoscale_maximum" {
  type        = number
  description = "The maximum number of instances for this resource."
  default     = 5
}

variable "function_issuer_autoscale_default" {
  type        = number
  description = "The number of instances that are available for scaling if metrics are not available for evaluation."
  default     = 1
}