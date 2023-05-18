variable "aws_region" {
  type        = string
  description = "AWS region to create resources. Default Milan"
  default     = "eu-south-1"
}

variable "environment" {
  type        = string
  description = "The environment"
}

variable "tags" {
  type        = map(string)
  description = "The property to which tagging the resources"
  default = {
    CreatedBy = "Terraform"
  }
}
