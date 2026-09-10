#!/bin/bash
# Скрипт для настройки ежедневного автозапуска тестирования в 22:00 на macOS

PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/kz.lexx.cunningfox.dailytest.plist"
SCRIPT_PATH="/Users/lexx/coding/projects/Cunning Fox/tools/daily_tester.py"
PYTHON_PATH=$(which python3)

mkdir -p "$PLIST_DIR"
mkdir -p "/Users/lexx/coding/projects/Cunning Fox/logs"

# Выгружаем старый демон, если был
launchctl unload "$PLIST_FILE" 2>/dev/null || true

cat <<EOF > "$PLIST_FILE"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>kz.lexx.cunningfox.dailytest</string>
    <key>ProgramArguments</key>
    <array>
        <string>$PYTHON_PATH</string>
        <string>$SCRIPT_PATH</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>22</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardOutPath</key>
    <string>/Users/lexx/coding/projects/Cunning Fox/logs/launchd_stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/lexx/coding/projects/Cunning Fox/logs/launchd_stderr.log</string>
</dict>
</plist>
EOF

# Загружаем новый демон
launchctl load "$PLIST_FILE"

echo "✅ Ежедневное расписание успешно настроено на 22:00 каждый день!"
echo "📄 Конфигурация: $PLIST_FILE"
echo "📜 Логи выполнения будут записываться в: /Users/lexx/coding/projects/Cunning Fox/logs/daily_test.log"
