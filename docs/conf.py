project = 'xeus-runner'
copyright = '2026, Ian Thomas'
author = 'Ian Thomas'

extensions = [
    "myst_parser",
    "sphinx_js"
]

exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

html_theme = "sphinx_book_theme"

js_language = 'typescript'
js_source_path = '../src'
jsdoc_config_path = 'typedoc.json'
jsdoc_tsconfig_path = '../tsconfig.json'

templates_path = ['_templates']
