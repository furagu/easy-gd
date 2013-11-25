test:
	node_modules/.bin/mocha --reporter list
benchmark:
	node benchmark/resize.js
.PHONY: test benchmark
