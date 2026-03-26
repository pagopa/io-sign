# GitHub repository module configuration
module "github_repository" {
  source  = "pagopa-dx/github-environment-bootstrap/github"
  version = "~> 1.0"

  repository = {
    name            = "io-sign"
    description     = "IO platform feature that allows the signing of PDF documents"
    topics          = ["io-sign", "io"]
    reviewers_teams = ["io-sign-admins", "io-sign-maintainers", "engineering-team-cloud-eng", "io-platform-contributors", "io-ecosystem-n-links"]
    pages_enabled   = false
    has_downloads   = true
    has_projects    = false
    has_issues      = false
    homepage_url    = "https://firma.io.italia.it/"
    environments    = ["prod"]
    jira_boards_ids = ["IEL"]
  }
}
