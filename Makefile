.DEFAULT_GOAL := help

.PHONY: dev.clean dev.build dev.run upgrade help requirements
.PHONY: extract_translations compile_translations
.PHONY: detect_changed_source_translations dummy_translations build_dummy_translations
.PHONY: validate_translations pull_translations push_translations install_transifex_clients

REPO_NAME := xblocks-contrib
PACKAGE_NAME := xblocks_contrib
EXTRACT_DIR := $(PACKAGE_NAME)/conf/locale/en/LC_MESSAGES
JS_TARGET := $(PACKAGE_NAME)/public/js/translations

help:
	@perl -nle'print $& if m{^[\.a-zA-Z_-]+:.*?## .*$$}' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-25s\033[0m %s\n", $$1, $$2}'

# Define PIP_COMPILE_OPTS=-v to get more information during make upgrade.
PIP_COMPILE = pip-compile --upgrade $(PIP_COMPILE_OPTS)

upgrade: export CUSTOM_COMPILE_COMMAND=make upgrade
upgrade: ## update the requirements/*.txt files with the latest packages satisfying requirements/*.in
	pip install -qr requirements/pip-tools.txt
	# Make sure to compile files after any other files they include!
	$(PIP_COMPILE) --allow-unsafe -o requirements/pip.txt requirements/pip.in
	$(PIP_COMPILE) -o requirements/pip-tools.txt requirements/pip-tools.in
	pip install -qr requirements/pip.txt
	pip install -qr requirements/pip-tools.txt
	$(PIP_COMPILE) -o requirements/base.txt requirements/base.in
	$(PIP_COMPILE) -o requirements/test.txt requirements/test.in
	$(PIP_COMPILE) -o requirements/doc.txt requirements/doc.in
	$(PIP_COMPILE) -o requirements/quality.txt requirements/quality.in
	$(PIP_COMPILE) -o requirements/dev.txt requirements/dev.in
	# Let tox control the Django version for tests
	sed '/^[dD]jango==/d' requirements/test.txt > requirements/test.tmp
	mv requirements/test.tmp requirements/test.txt

piptools: ## install pinned version of pip-compile and pip-sync
	pip install -r requirements/pip.txt
	pip install -r requirements/pip-tools.txt

requirements: piptools ## install development environment requirements
	pip-sync -q requirements/dev.txt requirements/private.*

dev.clean:
	-docker rm $(REPO_NAME)-dev
	-docker rmi $(REPO_NAME)-dev

dev.build:
	docker build --no-cache -t $(REPO_NAME)-dev $(CURDIR)

check-log:
	@if [ ! -d "$(CURDIR)/var" ]; then \
		echo "Creating var directory"; \
		mkdir -p $(CURDIR)/var; \
	fi
	@if [ ! -f "$(CURDIR)/var/workbench.log" ]; then \
		echo "Creating empty workbench.log"; \
		touch $(CURDIR)/var/workbench.log; \
	fi

dev.run: dev.clean dev.build check-log
	docker run -p 8000:8000 -v $(CURDIR):/usr/local/src/$(REPO_NAME) --name $(REPO_NAME)-dev $(REPO_NAME)-dev

# XBlock directories
XBLOCKS=$(shell find $(shell pwd)/$(PACKAGE_NAME) -maxdepth 2 -type d -name 'conf' -exec dirname {} \;)

## Localization targets

extract_translations: ## extract strings to be translated, outputting .po files for each XBlock
	@for xblock in $(XBLOCKS); do \
		echo "Extracting translations for $$xblock..."; \
		cd $$xblock && i18n_tool extract --no-segment --merge-po-files; \
		if [ -f $(EXTRACT_DIR)/django.po ]; then \
			mv $(EXTRACT_DIR)/django.po $(EXTRACT_DIR)/text.po; \
		fi; \
	done

compile_translations: ## compile translation files, outputting .mo files for each supported language for each XBlock
	django-admin compilemessages --locale en

detect_changed_source_translations:
	@for xblock in $(XBLOCKS); do \
		echo "Detecting changed translations for $$xblock..."; \
		cd $$xblock && i18n_tool changed; \
	done

dummy_translations: ## generate dummy translation (.po) files for each XBlock
	@for xblock in $(XBLOCKS); do \
		echo "Generating dummy translations for $$xblock..."; \
		cd $$xblock && i18n_tool dummy; \
	done

build_dummy_translations: dummy_translations compile_translations ## generate and compile dummy translation files

validate_translations: build_dummy_translations detect_changed_source_translations ## validate translations

pull_translations: ## pull translations from Transifex for each XBlock
	@for xblock in $(XBLOCKS); do \
		echo "Pulling translations for $$xblock..."; \
		cd $$xblock && i18n_tool transifex pull; \
	done

push_translations: extract_translations ## push translations to Transifex for each XBlock
	@for xblock in $(XBLOCKS); do \
		echo "Pushing translations for $$xblock..."; \
		cd $$xblock && i18n_tool transifex push; \
	done

install_transifex_client: ## Install the Transifex client
	# Instaling client will skip CHANGELOG and LICENSE files from git changes
	# so remind the user to commit the change first before installing client.
	git diff -s --exit-code HEAD || { echo "Please commit changes first."; exit 1; }
	curl -o- https://raw.githubusercontent.com/transifex/cli/master/install.sh | bash
	git checkout -- LICENSE README.md ## overwritten by Transifex installer

selfcheck: ## check that the Makefile is well-formed
	@echo "The Makefile is well-formed."
