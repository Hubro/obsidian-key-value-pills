plugins := "/home/tomas/Documents/Obsidian/Personal/.obsidian/plugins"

build:
    mkdir -p dist

    ./node_modules/.bin/esbuild main.ts \
        --bundle \
        --format=cjs \
        --external:obsidian \
        --external:codemirror \
        --external:@codemirror/language \
        --external:@codemirror/state \
        --external:@codemirror/view \
        --external:electron \
        --outfile=dist/main.js
        
    @cp manifest.json styles.css dist/

deploy: build
    #!/usr/bin/env bash

    if [[ ! -d "{{plugins}}" ]]; then
        echo "Plugin directory not found: {{plugins}}" >&2
        exit 1
    fi

    PLUGIN_DIR="{{plugins}}/key-value-pills"

    if [[ ! -d "$PLUGIN_DIR" ]]; then
        mkdir "$PLUGIN_DIR"
    fi

    cp -va dist/* "$PLUGIN_DIR/"
