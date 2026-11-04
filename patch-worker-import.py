#!/usr/bin/env python3
"""Run from the CodeForge project root. Fixes: 'Cannot use import statement outside a module' (npm run dev)."""
import sys
bad = 0
def edit(path, old, new):
    global bad
    s = open(path, encoding='utf-8').read()
    if old not in s: print('MISSING in', path, '->', old[:55]); bad += 1; return
    open(path, 'w', encoding='utf-8').write(s.replace(old, new, 1)); print('ok  ', path)
W = 'src/engines/sql.worker.js'
edit(W, "import { SEEDS } from './sql-seeds.js';\n", "")
edit(W, "function open(name, bytes) {", "function open(name, bytes, seed) {")
edit(W, "else if (SEEDS[schema]) db.run(SEEDS[schema]);", "else if (seed) db.run(seed);")
edit(W, "open(d.schema, d.bytes || null); finish();", "open(d.schema, d.bytes || null, d.seed); finish();")
edit(W, "open(d.schema, null); out(", "open(d.schema, null, d.seed); out(")
U = 'src/sql-ui.js'
edit(U, "import { SCHEMAS, QUERIES, STARTERS } from './sql-data.js';", "import { SCHEMAS, QUERIES, STARTERS } from './sql-data.js';\nimport { SEEDS } from './engines/sql-seeds.js';")
edit(U, "{ schema, bytes: loadBytes(schema) }", "{ schema, bytes: loadBytes(schema), seed: SEEDS[schema] }")
edit(U, "extra('reset', C.sink, { schema })", "extra('reset', C.sink, { schema, seed: SEEDS[schema] })")
print('DONE' if not bad else f'{bad} edit(s) missing — send me that message'); sys.exit(1 if bad else 0)
