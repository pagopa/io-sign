resource "github_branch_default" "default_main" {
  repository = github_repository.this.name
  branch     = "main"
}

resource "github_branch_protection" "main" {
  repository_id = github_repository.this.name
  pattern       = "main"

  force_push_bypassers = []

  required_status_checks {
    strict   = true
    contexts = []
  }

  require_conversation_resolution = true
  required_linear_history         = true

  #tfsec:ignore:github-branch_protections-require_signed_commits
  require_signed_commits = true #false

  required_pull_request_reviews {
    dismiss_stale_reviews           = false
    require_code_owner_reviews      = true
    required_approving_review_count = 1
    dismissal_restrictions = [
      "/lucacavallaro",
    ]
    pull_request_bypassers = []
    restrict_dismissals    = true
  }

  allows_deletions = false
}
