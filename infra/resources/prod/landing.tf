data "azurerm_resource_group" "core_ext" {
  name = format("%s-rg-external", local.product)
}

data "azurerm_dns_zone" "io_italia_it" {
  name                = "io.italia.it"
  resource_group_name = data.azurerm_resource_group.core_ext.name
}

resource "azurerm_dns_cname_record" "cloudfront" {
  name                = "firma"
  zone_name           = data.azurerm_dns_zone.io_italia_it.name
  resource_group_name = data.azurerm_resource_group.core_ext.name
  ttl                 = 3600
  record              = var.landing_cdn_url

  tags = var.tags
}
