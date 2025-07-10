#!/bin/bash
set -e

echo "Building from root directory..."
pwd
ls -la

echo "Installing dependencies with pnpm..."
pnpm install --no-frozen-lockfile

echo "Building the web app..."
cd apps/web
pnpm run build

echo "Build completed successfully!"
echo "Built files are in apps/web/dist/"
ls -la dist/ 