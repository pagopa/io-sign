resource "azurerm_key_vault" "this" {
  name                          = "${local.prefix}-${local.env_short}-${local.location_short}-${local.domain}-kv-${local.instance_number}"
  location                      = local.location
  resource_group_name           = local.resource_group_name
  tenant_id                     = data.azurerm_client_config.current.tenant_id
  sku_name                      = "premium"
  soft_delete_retention_days    = 90
  enabled_for_disk_encryption   = true
  purge_protection_enabled      = true
  public_network_access_enabled = false
  rbac_authorization_enabled    = true

  network_acls {
    bypass         = "AzureServices"
    default_action = "Allow"
  }

  tags = var.tags
}

resource "azurerm_management_lock" "this" {
  name       = format("%s-lock", azurerm_key_vault.this.name)
  scope      = azurerm_key_vault.this.id
  lock_level = "CanNotDelete"
  notes      = "this items can't be deleted in this subscription!"
}

resource "azurerm_private_endpoint" "vault" {
  name                = "${local.prefix}-${local.env_short}-${local.location_short}-${local.domain}-kv-pep-${local.instance_number}"
  location            = local.location
  resource_group_name = local.resource_group_name
  subnet_id           = data.azurerm_subnet.private_endpoints_subnet_itn.id
  private_service_connection {
    name                           = "${local.prefix}-${local.env_short}-${local.location_short}-${local.domain}-kv-pep-${local.instance_number}"
    private_connection_resource_id = azurerm_key_vault.this.id
    is_manual_connection           = false
    subresource_names              = ["vault"]
  }

  private_dns_zone_group {
    name                 = "private-dns-zone-group"
    private_dns_zone_ids = [var.vault_private_dns_zone_id]
  }

  tags = var.tags
}
