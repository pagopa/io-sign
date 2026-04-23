variable "key_vault_id" {
  type        = string
  description = "id of the sign key vault"
}

variable "tags" {
  type    = map(any)
  default = { CreatedBy = "Terraform" }
}
