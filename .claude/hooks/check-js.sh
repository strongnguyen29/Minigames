#!/bin/sh
# PostToolUse (Edit|Write): sau khi sửa js/*.js thì kiểm tra cú pháp và chạy các test có nạp file đó
f=$(jq -r '.tool_input.file_path // empty')
case "$f" in */js/*.js) ;; *) exit 0 ;; esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
rel="js/${f##*/js/}"

if ! out=$(node --check "$f" 2>&1); then
  printf 'Lỗi cú pháp trong %s:\n%s\n' "$rel" "$out" >&2
  exit 2
fi

tests=$(grep -l "'$rel'" tests/*.test.js 2>/dev/null)
[ -z "$tests" ] && exit 0
if ! out=$(node --test $tests 2>&1); then
  printf 'Test hỏng sau khi sửa %s (%s):\n%s\n' "$rel" "$(echo $tests)" "$(echo "$out" | grep -E -A12 '^not ok|^ *not ok' | head -60)" >&2
  exit 2
fi
exit 0
