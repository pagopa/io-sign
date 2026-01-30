locals {
  repository = {
    name            = "io-sign"
    description     = "Webservice that allows issuer and citizen to create digital signatures"
    topics          = ["io", "sign"]
    jira_boards_ids = ["IEL"]

    default_branch_name      = "main"
    infra_cd_policy_branches = ["main"]
    opex_cd_policy_branches  = ["main"]
    app_cd_policy_branches   = ["main"]

    reviewers_teams = [
      "io-ecosystem-n-links",
      "engineering-team-cloud-eng"
    ]
  }
}