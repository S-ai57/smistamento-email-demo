#!/bin/bash
# Avvia il BFF locale col modello vero e apre la demo.
# Finché la finestra resta aperta il modello e' raggiungibile;
# chiudendola il BFF si spegne e la demo ripiega sulle regole.
cd "$(dirname "$0")" || exit 1
if [ ! -f .env ]; then
  echo "Manca il file .env: copia .env.example in .env e inserisci le configurazioni." >&2
  exit 1
fi
pkill -f "server/server.js" 2>/dev/null
node server/server.js &
PID=$!
trap 'kill $PID 2>/dev/null' EXIT INT TERM
sleep 1
open index.html
wait $PID
