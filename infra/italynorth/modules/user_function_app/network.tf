resource "azurerm_subnet_nat_gateway_association" "io_sign_user_natgw_itn" {
  nat_gateway_id = data.azurerm_nat_gateway.nat_gateway_itn.id
  subnet_id      = module.function_sign_user.subnet.id
}