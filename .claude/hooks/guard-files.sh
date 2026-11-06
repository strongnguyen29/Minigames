#!/bin/sh
# PreToolUse (Edit|Write): chặn sửa file sinh tự động và file bí mật
f=$(jq -r '.tool_input.file_path // empty')
case "$f" in
  */audio/voice/manifest.js)
    echo "audio/voice/manifest.js được sinh tự động: chạy 'npm run voice:manifest' (hoặc voice:generate) thay vì sửa tay." >&2
    exit 2 ;;
  */.env)
    echo ".env chứa khoá ElevenLabs: để người dùng tự sửa, không ghi từ Claude." >&2
    exit 2 ;;
esac
exit 0
