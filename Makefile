test:
	node_modules/.bin/mocha --reporter list
benchmark:
	node benchmark/resize.js
cover:
	node_modules/istanbul/lib/cli.js cover node_modules/mocha/bin/_mocha -- --ui bdd -R spec -t 5000
.PHONY: test benchmark cover
