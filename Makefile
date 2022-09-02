run:
	npm run dev -- --open

host:
	npm run dev -- --host

check:
	npm run check

install:
	npm install

build:
	npm run build

docs:
	rst2html docs/index.rst > docs/index.html

TARGET := testing
# silly way of deploying app branch to github pages
deploy: build docs
	test "$(shell git branch --show-current)" = "app"
	sed -i 's|/assets/|assets/|g' dist/index.html
	git rm -r --ignore-unmatch docs/$(TARGET)
	mkdir -p docs/$(TARGET)
	cp -r dist/* docs/$(TARGET)
	git add docs/$(TARGET)
	git add docs/index.html
	git commit -m "deploy $(TARGET)"

.PHONY: run host install build docs deploy
