variable "tags" {
  type = map(any)
}

variable "prefix" {
  type = string
  validation {
    condition = (
      length(var.prefix) <= 6
    )
    error_message = "Max length is 6 chars."
  }
}

variable "env" {
  type        = string
  description = "Environment"
}

variable "env_short" {
  type = string
  validation {
    condition = (
      length(var.env_short) <= 1
    )
    error_message = "Max length is 1 chars."
  }
}

variable "domain" {
  type        = string
  description = "The applicative domain"
  validation {
    condition = (
      length(var.domain) < 6
    )
    error_message = "Max length is 6 chars."
  }
}

variable "github" {
  type = object({
    org        = string
    repository = string
  })
  description = "GitHub Organization and repository name"
  default = {
    org        = "pagopa"
    repository = "io-sign"
  }
}

variable "opex_environment_ci_roles" {
  type = object({
    subscription    = list(string)
    resource_groups = map(list(string))
  })
  description = "Continous Integration roles for opex managed identiy"
}

variable "opex_environment_cd_roles" {
  type = object({
    subscription    = list(string)
    resource_groups = map(list(string))
  })
  description = "Continous Delivery roles for opex managed identiy"
}

variable "web_apps_environment_cd_roles" {
  type = object({
    subscription    = list(string)
    resource_groups = map(list(string))
  })
  description = "GitHub Continous Delivery roles for web apps managed identity"
}

variable "location" {
  type    = string
  default = "westeurope"
}
