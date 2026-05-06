#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate

# 从 .env 文件加载环境变量（如果存在）
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

exec uvicorn main:app --host 0.0.0.0 --port 8000
