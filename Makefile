run:
	npm run dev -- --open

host:
	npm run dev -- --host

install:
	npm install

build:
	npm run build

TARGET := testing
deploy:
	npm run build
	sed -i 's|/assets/|assets/|g' dist/index.html
	git rm -r --ignore-unmatch docs/$(TARGET)
	mkdir -p docs/$(TARGET)
	cp -r dist/* docs/$(TARGET)
	git add docs/$(TARGET)
	git commit -m "deploy $(TARGET)"
