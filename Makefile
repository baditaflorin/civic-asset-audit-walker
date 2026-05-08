.PHONY: help install-hooks dev build data test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## Wire local git hooks
	git config core.hooksPath .githooks

dev: ## Run the frontend dev server
	npm run dev

build: ## Build the GitHub Pages site into docs/
	npm run build

data: ## Mode A has no offline data pipeline
	@echo "Mode A: no generated static data pipeline."

test: ## Run unit tests
	npm run test

test-integration: ## Run integration tests
	npm run test:integration

smoke: ## Run the static Pages smoke test
	npm run smoke

lint: ## Run all linters and format checks
	npm run lint && npm run fmt:check && npm run typecheck

fmt: ## Autoformat source files
	npm run fmt

pages-preview: ## Serve docs/ locally like GitHub Pages
	npm run pages-preview

release: ## Tag the current commit
	@test -n "$(VERSION)" || (echo "VERSION=vX.Y.Z is required" && exit 1)
	git tag "$(VERSION)"
	git push origin "$(VERSION)"

hooks-pre-commit:
	npm run hooks:pre-commit

hooks-commit-msg:
	npm run hooks:commit-msg

hooks-pre-push:
	npm run hooks:pre-push

clean: ## Remove generated build and test outputs
	npm run clean

