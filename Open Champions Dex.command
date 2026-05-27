#!/bin/zsh

APP_DIR="${0:A:h}"
cd "$APP_DIR" || exit 1

PORT=$(python3 - <<'PY'
import socket

with socket.socket() as sock:
    sock.bind(("127.0.0.1", 0))
    print(sock.getsockname()[1])
PY
)

URL="http://localhost:${PORT}"

echo "Champions Dex wordt gestart..."
echo "App-map: $APP_DIR"
echo "Adres: $URL"
echo
echo "Sluit dit venster om de app te stoppen."

python3 -m http.server "$PORT" --bind 127.0.0.1 &
SERVER_PID=$!

sleep 1
open "$URL"

trap 'kill "$SERVER_PID" 2>/dev/null' EXIT INT TERM
wait "$SERVER_PID"
