variable "tags" {
  type = map(any)
  default = {
    CreatedBy = "Terraform"
  }
}
variable "environment" {
  type = object({
    prefix          = string
    env_short       = string
    location        = string
    domain          = optional(string)
    app_name        = string
    instance_number = string
  })
  description = "environment values"
}

variable "resource_group_name" {
  type        = string
  description = "name of the resource group"
}

variable "io_sign_database_issuer" {
  type = map(object({
    max_throughput = number
    ttl            = optional(number)
  }))
  description = "throughput and TTL settings for the issuer database containers"
}

variable "io_sign_database_user" {
  type = map(object({
    max_throughput = number
    ttl            = optional(number)
  }))
  description = "throughput and TTL settings for the user database containers"
}

variable "io_sign_database_backoffice" {
  type = map(object({
    max_throughput = number
    ttl            = optional(number)
  }))
  description = "throughput and TTL settings for the backoffice database containers"
}
