##########
#  APIM  #
##########

variable "apim_name" {
  type        = string
  description = "APIM Resource name"
}

variable "apim_resource_group_name" {
  type        = string
  description = "APIM Resource group name"
}

variable "apim_identity_principal_id" {
  type        = string
  description = "APIM managed identity principal ID"
}

variable "subscription_id" {
  type        = string
  description = "Azure Subscription ID"
}

##############
#  Key Vault #
##############

variable "key_vault_name_itn" {
  type        = string
  description = "Key Vault name for ITN"
}

variable "key_vault_resource_group_name_itn" {
  type        = string
  description = "Key Vault resource group name for ITN"
}

variable "key_vault_vault_uri_itn" {
  type        = string
  description = "Key Vault URI for ITN (e.g. https://kv-name.vault.azure.net/)"
}

##########
# Locals #
##########

variable "project_itn" {
  type        = string
  description = "ITN project prefix (e.g. io-p-itn)"
}

variable "product" {
  type        = string
  description = "Product prefix (e.g. io-p)"
}

###########
#  Cosmos #
###########

variable "cosmosdb_account_name" {
  type        = string
  description = "Cosmos DB account name"
}

variable "cosmosdb_sql_database_issuer_name" {
  type        = string
  description = "Cosmos DB SQL database name for issuer"
  default     = "issuer"
}

variable "cosmosdb_sql_container_issuer_issuers_whitelist_name" {
  type        = string
  description = "Cosmos DB SQL container name for issuer issuers-whitelist"
  default     = "issuers-whitelist"
}

variable "cosmosdb_sql_container_issuer_issuers_name" {
  type        = string
  description = "Cosmos DB SQL container name for issuer issuers"
  default     = "issuers"
}

variable "cosmosdb_sql_database_backoffice_name" {
  type        = string
  description = "Cosmos DB SQL database name for backoffice"
  default     = "backoffice"
}

variable "cosmosdb_sql_container_backoffice_api_keys_name" {
  type        = string
  description = "Cosmos DB SQL container name for backoffice api-keys"
  default     = "api-keys"
}
