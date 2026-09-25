# --- removed blocks: these resources have been imported into the italynorth state ---

removed {
  from = azurerm_resource_group.data_rg

  lifecycle {
    destroy = false
  }
}

removed {
  from = azurerm_resource_group.integration_rg

  lifecycle {
    destroy = false
  }
}

removed {
  from = azurerm_dns_zone.firma_io_pagopa_it

  lifecycle {
    destroy = false
  }
}

removed {
  from = azurerm_dns_mx_record.ses_mx_firma_io_pagopa_it

  lifecycle {
    destroy = false
  }
}

removed {
  from = azurerm_dns_cname_record.ses_validation_firma_io_pagopa_it

  lifecycle {
    destroy = false
  }
}

removed {
  from = azurerm_dns_txt_record.spf1_mailup_firma_io_pagopa_it

  lifecycle {
    destroy = false
  }
}

removed {
  from = azurerm_dns_cname_record.dkim1_mailup_firma_io_pagopa_it

  lifecycle {
    destroy = false
  }
}

removed {
  from = azurerm_dns_cname_record.dkim2_mailup_firma_io_pagopa_it

  lifecycle {
    destroy = false
  }
}

removed {
  from = azurerm_dns_txt_record.dmarc_mailup_firma_io_pagopa_it

  lifecycle {
    destroy = false
  }
}

removed {
  from = azurerm_dns_cname_record.cloudfront

  lifecycle {
    destroy = false
  }
}
