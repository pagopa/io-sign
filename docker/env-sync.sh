#!/bin/bash

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENV_FILE="$SCRIPT_DIR/.env.common"

EXAMPLE_FILE="$SCRIPT_DIR/.env.common.example"

# Exit if .env.common.example does not exist
if [ ! -f "$EXAMPLE_FILE" ]; then
  echo "❌ Error: $EXAMPLE_FILE does not exist."
  exit 1
fi

# Create .env.common if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  touch "$ENV_FILE"
fi

# Read current keys from .env.common into a regular array
env_keys=()
while IFS= read -r line; do
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
  key="${line%%=*}"
  env_keys+=("$key")
done < "$ENV_FILE"

# Loop over .env.common.example
added=0
while IFS= read -r line; do
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue
  key="${line%%=*}"
  
  # Check if the key is already in the env_keys array
  if [[ ! " ${env_keys[@]} " =~ " ${key} " ]]; then
    echo "$line" >> "$ENV_FILE"
    echo "➕ Added: $key"
    ((added++))
  fi
done < "$EXAMPLE_FILE"

if [[ $added -eq 0 ]]; then
  echo "✅ .env.common already has all keys from .env.common.example"
else
  echo "🔧 Added $added missing key(s) from .env.common.example"
fi