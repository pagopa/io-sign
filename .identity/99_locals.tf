locals {
  # tflint-ignore: terraform_unused_declarations
  project  = "${var.prefix}-${var.env_short}-${var.domain}"
  app_name = "github-${var.github.org}-${var.github.repository}-${var.env}"

  environment_cd_resource_group_roles = distinct(flatten([
    for rg, role_list in var.environment_cd_roles.resource_groups : [
      for role in role_list : {
        resource_group = rg
        role           = role
      }
    ]
  ]))
}
