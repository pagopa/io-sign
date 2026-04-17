##########
#  APIM  #
##########

variable "platform_apim_name" {
  type        = string
  description = "APIM Resource name"
}

variable "platform_apim_id" {
  type        = string
  description = "APIM Resource ID"
}

variable "platform_apim_resource_group_name" {
  type        = string
  description = "APIM Resource group name"
}

variable "platform_apim_identity_principal_id" {
  type        = string
  description = "APIM Resource Identity Principal ID"
}

variable "key_vault_common_uri" {
  type        = string
  description = "Key Vault Common URI"
}

variable "key_vault_common_name" {
  type        = string
  description = "Key Vault Common Name"
}

variable "key_vault_resource_group_name" {
  type        = string
  description = "Key Vault Resource Group Name"
}

variable "subscription_id" {
  type        = string
  description = "Subscription ID"
}

variable "key_vault_common_uri_itn" {
  type        = string
  description = "Key Vault Common URI ITN"
}

variable "key_vault_common_name_itn" {
  type        = string
  description = "Key Vault Common Name ITN"
}

variable "key_vault_resource_group_name_itn" {
  type        = string
  description = "Key Vault Resource Group Name ITN"
}
