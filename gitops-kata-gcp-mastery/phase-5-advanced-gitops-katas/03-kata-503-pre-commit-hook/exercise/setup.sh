#!/bin/sh
# Run this script once to set up the kata-503 demo repo

set -e

TARGET_DIR="${1:-kata-503-demo}"

echo "Setting up kata-503 demo in $TARGET_DIR..."

mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

git init

# Copy chart and values
mkdir -p charts
cp -r "../../02-kata-502-namespace-quotas-helm/exercise/gke-team-onboarding" charts/
cp charts/gke-team-onboarding/values.yaml .
mkdir -p resources

# Install the pre-commit hook
cp ../pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# Initial commit
git add .
git commit -m "initial: add helm chart and values"

echo ""
echo "Done! Next steps:"
echo "  cd $TARGET_DIR"
echo "  Edit values.yaml to change a quota"
echo "  git add values.yaml && git commit -m 'update quota'"
echo "  Watch the hook auto-render and stage resources/"
