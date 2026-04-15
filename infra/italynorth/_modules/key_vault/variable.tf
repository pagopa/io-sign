variable "tags" {
  type = map(any)
  default = {
    CreatedBy = "Terraform"
  }
}

variable "naming_config" {
  type = object({
    prefix          = string,
    environment     = string,
    location        = string,
    domain          = string,
    name            = string,
    instance_number = optional(number, 1),
  })
  description = "Map with naming values for resource names"
}
