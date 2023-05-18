locals {
  receipt_rule_name = "no-reply-mailup"
}

resource "aws_s3_bucket" "ses_incoming" {
  bucket_prefix = "ses-incoming-"
}

resource "aws_s3_bucket_ownership_controls" "ses_incoming" {
  bucket = aws_s3_bucket.ses_incoming.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "ses_incoming" {
  bucket = aws_s3_bucket.ses_incoming.id
  acl    = "private"

  depends_on = [aws_s3_bucket_ownership_controls.ses_incoming]
}

resource "aws_s3_bucket_versioning" "ses_incoming" {
  bucket = aws_s3_bucket.ses_incoming.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_policy" "ses_incoming" {
  bucket = aws_s3_bucket.ses_incoming.id
  policy = data.aws_iam_policy_document.ses_incoming_mailup.json
}

data "aws_iam_policy_document" "ses_incoming_mailup" {
  statement {
    principals {
      type = "Service"
      identifiers = ["ses.amazonaws.com"]
    }
    actions = [
      "s3:PutObject"
    ]
    resources = [
      format("%s/*", aws_s3_bucket.ses_incoming.arn)
    ]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceAccount"

      values = [
        local.aws_account_id
      ]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"

      values = [
        format("%s:receipt-rule/%s", aws_ses_receipt_rule_set.mailup.arn, local.receipt_rule_name)
      ]
    }
  }
}

resource "aws_ses_domain_identity" "firma_io_pagopa_it" {
  domain = "firma.io.pagopa.it"
}

resource "aws_ses_domain_dkim" "firma_io_pagopa_it" {
  domain = aws_ses_domain_identity.firma_io_pagopa_it.domain
}

# Add a header to the email and store it in S3
resource "aws_ses_receipt_rule" "noreply_mailup" {
  name          = local.receipt_rule_name
  rule_set_name = aws_ses_receipt_rule_set.mailup.id
  recipients    = ["no-reply@firma.io.pagopa.it"]
  enabled       = true
  scan_enabled  = true

  add_header_action {
    header_name  = "X-Processed-By"
    header_value = "AWS-SES"
    position     = 1
  }

  s3_action {
    bucket_name = aws_s3_bucket.ses_incoming.id
    object_key_prefix = "no-reply-mailup"
    position    = 2
  }

  depends_on = [
    aws_s3_bucket_policy.ses_incoming
  ]
}

resource "aws_ses_receipt_rule_set" "mailup" {
  rule_set_name = "mailup"
}

resource "aws_ses_active_receipt_rule_set" "mailup" {
  rule_set_name = aws_ses_receipt_rule_set.mailup.id
}
