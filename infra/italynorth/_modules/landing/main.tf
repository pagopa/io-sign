resource "azurerm_dns_cname_record" "cloudfront" {
  name                = "firma"
  zone_name           = data.azurerm_dns_zone.io_italia_it.name
  resource_group_name = data.azurerm_resource_group.core_ext.name
  ttl                 = 3600
  record              = local.landing_cdn_url

  tags = var.tags
}
