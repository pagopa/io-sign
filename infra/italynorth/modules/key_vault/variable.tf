variable "tags" {
  type = map(any)
  default = {
    CreatedBy = "Terraform"
  }
}
