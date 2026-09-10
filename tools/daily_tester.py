#!/usr/bin/env python3
"""
Daily Pack Apps Automation Tester for Detective Gang / Cunning Fox
Автоматический ежедневный прогон всех приложений из Pack:
1. Проверяет запущен ли эмулятор Android (если нет — запускает).
2. Разблокирует/пробуждает экран.
3. Поочередно запускает каждое установленное приложение из Pack.
4. Удерживает каждое приложение активным 40 секунд (с имитацией легких касаний/скролла для фиксации Google Play telemetry).
5. В конце открывает Testers Community для синхронизации прогресса.
6. Ведет подробный лог в logs/daily_test.log.
"""

import datetime
import os
import random
import shutil
import subprocess
import sys
import time

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGS_DIR = os.path.join(PROJECT_DIR, "logs")
LOG_FILE = os.path.join(LOGS_DIR, "daily_test.log")
LAST_RUN_FILE = os.path.join(LOGS_DIR, "last_successful_run.txt")

os.makedirs(LOGS_DIR, exist_ok=True)

# Пути к ADB и Emulator
ADB_CANDIDATES = [
    "/opt/homebrew/share/android-commandlinetools/platform-tools/adb",
    shutil.which("adb") or "",
    os.path.expanduser("~/Library/Android/sdk/platform-tools/adb"),
]

EMULATOR_CANDIDATES = [
    "/opt/homebrew/share/android-commandlinetools/emulator/emulator",
    shutil.which("emulator") or "",
]

def get_binary(candidates, fallback):
    for p in candidates:
        if p and os.path.exists(p) and os.access(p, os.X_OK):
            return p
    return fallback

ADB = get_binary(ADB_CANDIDATES, "adb")
EMULATOR = get_binary(EMULATOR_CANDIDATES, "emulator")

# Исключения (системные пакеты и сам Testers Community)
IGNORED_PACKAGES = {
    "com.testerscommunity",
    "com.android.vending",
    "com.google.android.gms",
    "com.google.android.gsf",
    "com.google.android.contactkeys",
    "com.google.android.verifier",
}

def log(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    print(formatted, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(formatted + "\n")
    except Exception:
        pass

def adb_cmd(args, timeout=30):
    cmd = [ADB] + args
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return res.stdout.strip()
    except Exception as e:
        log(f"[ADB Error] {' '.join(cmd)}: {e}")
        return ""

def is_emulator_running():
    devices = adb_cmd(["devices"])
    for line in devices.splitlines()[1:]:
        if "device" in line and not "offline" in line:
            return True
    return False

def start_emulator_if_needed():
    if is_emulator_running():
        log("📱 Эмулятор уже запущен и подключен.")
        return True

    log("⚡ Запуск Android эмулятора (AVD: tester)...")
    cmd = [EMULATOR, "-avd", "tester", "-no-snapshot-load", "-no-boot-anim"]
    subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Ждем готовности эмулятора
    for i in range(40):
        time.sleep(3)
        if is_emulator_running():
            boot_completed = adb_cmd(["shell", "getprop", "sys.boot_completed"])
            if boot_completed == "1":
                log("✅ Эмулятор успешно загружен!")
                time.sleep(5)
                return True
    log("⚠️ Эмулятор не ответил вовремя.")
    return False

def wake_up():
    """Включает экран и снимает блокировку."""
    log("💡 Пробуждение экрана...")
    adb_cmd(["shell", "input", "keyevent", "224"]) # KEYCODE_WAKEUP
    time.sleep(1)
    adb_cmd(["shell", "input", "keyevent", "82"])  # KEYCODE_MENU (unlock)
    time.sleep(1)

def get_installed_pack_packages():
    """Получает список всех сторонних приложений для тестирования."""
    raw = adb_cmd(["shell", "pm", "list", "packages", "-3"])
    packages = []
    for line in raw.splitlines():
        line = line.strip()
        if line.startswith("package:"):
            pkg = line.replace("package:", "").strip()
            if pkg not in IGNORED_PACKAGES and not pkg.startswith("com.google.android"):
                packages.append(pkg)
    return sorted(packages)

def simulate_app_interaction(duration_seconds=40):
    """Имитирует легкую активность пользователя (скроллы, тапы) для фиксации телеметрии Google."""
    start_time = time.time()
    while time.time() - start_time < duration_seconds:
        # Случайное действие раз в 8-10 секунд
        time.sleep(random.randint(8, 11))
        action = random.choice(["tap", "swipe", "noop"])
        if action == "tap":
            rx = random.randint(400, 2000)
            ry = random.randint(400, 1200)
            adb_cmd(["shell", "input", "tap", str(rx), str(ry)])
        elif action == "swipe":
            adb_cmd(["shell", "input", "swipe", "1280", "1000", "1280", "600", "300"])

def test_app(pkg_name, index, total):
    log(f"[{index}/{total}] 🚀 Открываем приложение: {pkg_name}")
    
    # Запускаем приложение через launcher intent
    res = adb_cmd(["shell", "monkey", "-p", pkg_name, "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(3)

    log(f"   ⏱ Удерживаем открытым 40 секунд...")
    simulate_app_interaction(duration_seconds=37)
    log(f"   ✅ Тестирование {pkg_name} завершено.")

def stop_emulator():
    """Корректно останавливает эмулятор."""
    log("🛑 Выключение эмулятора Android...")
    adb_cmd(["emu", "kill"])
    time.sleep(3)

def put_mac_to_sleep():
    """Отправляет Mac в режим сна после завершения работы."""
    log("💤 Завершено. Отправка Mac в режим сна...")
    try:
        subprocess.run(["osascript", "-e", 'tell application "System Events" to sleep'], check=False)
    except Exception as e:
        log(f"⚠️ Не удалось усыпить Mac автоматически: {e}")

def main():
    log("==================================================")
    log("🏁 ЗАПУСК ЕЖЕДНЕВНОГО ТЕСТИРОВАНИЯ PACK ПРИЛОЖЕНИЙ")
    log("==================================================")

    today_str = datetime.date.today().isoformat()
    force_run = "--force" in sys.argv

    if os.path.exists(LAST_RUN_FILE) and not force_run:
        try:
            with open(LAST_RUN_FILE, "r", encoding="utf-8") as f:
                last_date = f.read().strip()
            if last_date == today_str:
                log(f"✅ Сегодняшний прогон ({today_str}) уже был успешно выполнен ранее. Пропускаем.")
                sys.exit(0)
        except Exception:
            pass

    if not start_emulator_if_needed():
        log("❌ Ошибка: не удалось подключиться к эмулятору.")
        sys.exit(1)

    wake_up()

    packages = get_installed_pack_packages()
    total = len(packages)
    log(f"📦 Найдено приложений из Pack для тестирования: {total}")

    if total == 0:
        log("⚠️ Не найдено установленных приложений для теста.")
        stop_emulator()
        sys.exit(0)

    start_all = time.time()
    for idx, pkg in enumerate(packages, 1):
        try:
            test_app(pkg, idx, total)
        except Exception as e:
            log(f"❌ Ошибка при тесте {pkg}: {e}")

    # В конце открываем Testers Community для синхронизации
    log("🔄 Открываем Testers Community для обновления статуса...")
    adb_cmd(["shell", "monkey", "-p", "com.testerscommunity", "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(5)

    elapsed_min = round((time.time() - start_all) / 60, 1)
    log("==================================================")
    log(f"🎉 Ежедневный прогон завершен! Протестировано: {total} приложений за {elapsed_min} мин.")
    log("==================================================")

    # Фиксируем успешную дату
    try:
        with open(LAST_RUN_FILE, "w", encoding="utf-8") as f:
            f.write(today_str)
    except Exception:
        pass

    # Выключаем эмулятор и усыпляем Mac
    stop_emulator()
    put_mac_to_sleep()

if __name__ == "__main__":
    main()

