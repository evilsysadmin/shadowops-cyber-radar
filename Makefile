.PHONY: serve test
PORT ?= 8080

serve:
	node scripts/serve-local.cjs "$(PORT)"

test:
	node --test tests/*.test.cjs
	python3 -m unittest discover -s tests -p 'test_*.py'
