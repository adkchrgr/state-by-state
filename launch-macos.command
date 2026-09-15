#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
bash build-macos.sh --launch
