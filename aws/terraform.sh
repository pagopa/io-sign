#!/usr/bin/env bash

set -o pipefail

action=$1
env=$2

ARGS=("${@:3}")

if [ -z "$action" ]; then
  echo "Missed action: init, apply, plan, refresh"
  exit 0
fi

if [ -z "$env" ]; then
  echo "env should be: dev, uat or prod."
  exit 0
fi

if echo "init plan apply refresh import output state taint destroy" | grep -w "$action" > /dev/null; then
  if [ "$action" = "init" ]; then

    REGION=$(sed -nE 's|region[[:space:]]*=[[:space:]]*"(.+)"|\1|p' "./env/${env}/backend.tfvars")
    BUCKET=$(sed -nE 's|bucket[[:space:]]*=[[:space:]]*"(.+)"|\1|p' "./env/${env}/backend.tfvars")
    DYNAMODB_TABLE=$(sed -nE 's|dynamodb_table[[:space:]]*=[[:space:]]*"(.+)"|\1|p' "./env/${env}/backend.tfvars")

    aws s3api head-bucket --bucket "$BUCKET" > /dev/null 2> /dev/null
    if test $? -gt 0; then
        aws s3api create-bucket \
            --bucket "$BUCKET" \
            --create-bucket-configuration LocationConstraint="$REGION" \
            --region "$REGION"

        aws s3api put-public-access-block \
            --bucket "$BUCKET" \
            --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \
            --region "$REGION"

        aws s3api put-bucket-versioning \
            --bucket "$BUCKET" \
            --versioning-configuration Status=Enabled \
            --region "$REGION"
    fi

    aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$REGION" > /dev/null 2> /dev/null
    if test $? -gt 0; then
        aws dynamodb create-table \
            --table-name "$DYNAMODB_TABLE" \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --billing-mode PAY_PER_REQUEST \
            --region "$REGION"
    fi

    terraform init -reconfigure -backend-config="./env/${env}/backend.tfvars" ${ARGS[@]+"${ARGS[@]}"}

    rm .terraform.lock.hcl
		terraform providers lock \
			-platform=windows_amd64 \
			-platform=darwin_amd64 \
			-platform=darwin_arm64 \
			-platform=linux_amd64
  elif [ "$action" = "output" ] || [ "$action" = "state" ] || [ "$action" = "taint" ]; then
    terraform init -reconfigure -backend-config="./env/${env}/backend.tfvars"
    terraform "$action" ${ARGS[@]+"${ARGS[@]}"}
  else
    terraform init -reconfigure -backend-config="./env/${env}/backend.tfvars"
    terraform "$action" -var-file="./env/${env}/terraform.tfvars" ${ARGS[@]+"${ARGS[@]}"}
  fi
else
    echo "Action not allowed."
    exit 1
fi
