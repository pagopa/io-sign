output "account" {
  value = {
    name              = azurerm_storage_account.sign.name
    resource_group    = azurerm_storage_account.sign.resource_group_name
    blob_service_uri  = azurerm_storage_account.sign.primary_blob_endpoint
    queue_service_uri = azurerm_storage_account.sign.primary_queue_endpoint
  }
}
