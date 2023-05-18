# SES Incoming is not available in eu-south-1 (Milan)
# https://docs.aws.amazon.com/ses/latest/dg/regions.html#region-receive-email
aws_region  = "eu-west-1"
environment = "prod"

tags = {
  CreatedBy   = "Terraform"
  Environment = "prod"
  Owner       = "Firma con IO"
  Source      = "https://github.com/pagopa/io-sign"
  CostCenter  = "BD100 - STRATEGIC INNOVATION"
}
