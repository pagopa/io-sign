output "tenant_id" {
  value = data.azurerm_client_config.current.tenant_id
}

output "subscription_id" {
  value = data.azurerm_subscription.current.subscription_id
}

output "web_apps_managed_identities" {
  value = {
    app_name       = module.web_apps_identity_cd.identity_app_name
    client_id      = module.web_apps_identity_cd.identity_client_id
  }
}

output "opex_ci_managed_identities" {
  value = {
    app_name       = module.opex_identity_ci.identity_app_name
    client_id      = module.opex_identity_ci.identity_client_id
  }
}

output "opex_cd_managed_identities" {
  value = {
    app_name       = module.opex_identity_cd.identity_app_name
    client_id      = module.opex_identity_cd.identity_client_id
  }
}
