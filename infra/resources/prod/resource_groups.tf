# Ownership moved to infra/italynorth/prod, kept in Azure (not destroyed)
removed {
  from = azurerm_resource_group.sign

  lifecycle {
    destroy = false
  }
}

