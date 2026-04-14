variable "tags" {
  type = map(any)
  default = {
    CreatedBy = "Terraform"
  }
}

variable "adgroup_admin_object_id" {
  type = string
}

variable "adgroup_developers_object_id" {
  type = string
}

variable "adgroup_sign_object_id" {
  type = string
}

variable "adgroup_ecosystem_n_links_object_id" {
  type = string
}

variable "platform_iac_sp_object_id" {
  type = string
}
