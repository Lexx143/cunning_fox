#!/usr/bin/env python3
"""
Autonomous Moon Farming & Pack Joining Script for Testers Community
1. Автоматически прокликивает ленту на Home вкладке через UI Testers Community.
2. Открывает каждую карточку -> нажимает Test Now -> переходит в Play Store / App -> удерживает 35-40 сек.
3. Возвращается и фиксирует получение Moons.
4. Повторяет до тех пор, пока баланс не станет >= 100 лун (для вступления в новый Pack).
5. Как только баланс >= 100 лун -> переходит в Pack -> вступает в доступный Pack с Detective Gang!
"""

import os
import random
import re
import shutil
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = "/opt/homebrew/share/android-commandlinetools/platform-tools/adb"
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_FILE = os.path.join(PROJECT_DIR, "logs", "farm_moons.log")

os.makedirs(os.path.join(PROJECT_DIR, "logs"), exist_ok=True)

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {msg}"
    print(formatted, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(formatted + "\n")

def adb(args, timeout=30):
    cmd = [ADB] + args
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return res.stdout.strip()
    except Exception as e:
        log(f"[ADB Err] {e}")
        return ""

def tap(x, y):
    adb(["shell", "input", "tap", str(int(x)), str(int(y))])
    time.sleep(1.5)

def key_back():
    adb(["shell", "input", "keyevent", "4"])
    time.sleep(1.5)

def dump_ui():
    adb(["shell", "uiautomator", "dump", "/sdcard/window_dump.xml"])
    res = adb(["shell", "cat", "/sdcard/window_dump.xml"])
    try:
        return ET.fromstring(res)
    except Exception:
        return None

def parse_bounds(bounds_str):
    # e.g. "[100,200][300,400]"
    m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds_str)
    if m:
        x1, y1, x2, y2 = map(int, m.groups())
        return (x1, y1, x2, y2, (x1 + x2) // 2, (y1 + y2) // 2)
    return None

def get_current_moons(root):
    if root is None:
        return None
    for node in root.iter("node"):
        desc = node.attrib.get("content-desc", "")
        # looking for node with numeric desc near top right (like -160, 20, 100)
        bounds = node.attrib.get("bounds", "")
        b = parse_bounds(bounds)
        if b and b[1] < 200 and b[0] > 2000:
            # Check if desc is an integer
            try:
                val = int(desc.replace(",", "").strip())
                return val
            except ValueError:
                pass
    return None

def ensure_home_tab():
    log("🏠 Переход на вкладку Home...")
    # Home button is at bottom-left: X=320, Y=1460
    tap(320, 1460)
    time.sleep(2)

def handle_play_store_or_app(duration=35):
    """Ищет кнопки Install / Open в Play Store, ждет загрузки и имитирует использование."""
    log("   🔍 Проверяем Play Store / приложение...")
    for _ in range(12):
        time.sleep(2)
        root = dump_ui()
        if root is None:
            continue
        
        # Check for "Item not found" or "Try again"
        for node in root.iter("node"):
            desc = node.attrib.get("content-desc", "")
            text = node.attrib.get("text", "")
            if "Item not found" in desc or "Item not found" in text:
                log("   ⚠️ Приложение недоступно в регионе (Item not found).")
                return False
            
            # Check for "Install" button
            if (desc == "Install" or text == "Install") and node.attrib.get("clickable") == "true":
                b = parse_bounds(node.attrib.get("bounds", ""))
                if b:
                    log(f"   📥 Нажимаем 'Install' в Play Store (X={b[4]}, Y={b[5]})...")
                    tap(b[4], b[5])
                    break
            
            # Check for "Play" or "Open" button
            if (desc in ("Open", "Play") or text in ("Open", "Play")) and node.attrib.get("clickable") == "true":
                b = parse_bounds(node.attrib.get("bounds", ""))
                if b:
                    log(f"   ▶️ Нажимаем 'Play / Open' (X={b[4]}, Y={b[5]})...")
                    tap(b[4], b[5])
                    break

    log(f"   ⏱ Удерживаем приложение открытым {duration} секунд...")
    start_t = time.time()
    while time.time() - start_t < duration:
        time.sleep(random.randint(7, 10))
        rx, ry = random.randint(400, 2000), random.randint(400, 1200)
        adb(["shell", "input", "tap", str(rx), str(ry)])

    return True

def farm_single_app(card_center_x, card_center_y):
    log(f"👉 Открываем карточку приложения (X={card_center_x}, Y={card_center_y})...")
    tap(card_center_x, card_center_y)
    time.sleep(2)

    root = dump_ui()
    if root is None:
        key_back()
        return False

    # Check if already tested
    for node in root.iter("node"):
        desc = node.attrib.get("content-desc", "")
        if "Already Tested" in desc:
            log("   ℹ️ Приложение уже протестировано ранее. Пропускаем.")
            key_back()
            return False

    # Find "Test Now" button (usually at bottom)
    test_now_btn = None
    for node in root.iter("node"):
        desc = node.attrib.get("content-desc", "")
        text = node.attrib.get("text", "")
        if "Test Now" in desc or "Test Now" in text:
            b = parse_bounds(node.attrib.get("bounds", ""))
            if b:
                test_now_btn = b
                break

    if not test_now_btn:
        # Fallback coordinate for Test Now
        test_now_btn = (38, 1406, 2522, 1506, 1280, 1456)

    log(f"   🔵 Нажимаем 'Test Now' (X={test_now_btn[4]}, Y={test_now_btn[5]})...")
    tap(test_now_btn[4], test_now_btn[5])
    time.sleep(2)

    # In modal: check for "Install the app" or "Use for at least 30 seconds" / "Test app"
    modal_root = dump_ui()
    if modal_root:
        for node in modal_root.iter("node"):
            desc = node.attrib.get("content-desc", "")
            text = node.attrib.get("text", "")
            if "Install the app" in desc or "Install the app" in text or "Test app" in desc or "Open app" in desc:
                b = parse_bounds(node.attrib.get("bounds", ""))
                if b and b[1] > 400:
                    log(f"   🚀 Нажимаем действие в модалке '{desc or text}' (X={b[4]}, Y={b[5]})...")
                    tap(b[4], b[5])
                    break

    time.sleep(3)
    handle_play_store_or_app(duration=35)

    # Return to Testers Community
    log("   🔙 Возвращаемся в Testers Community...")
    adb(["shell", "monkey", "-p", "com.testerscommunity", "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(2)
    key_back()
    time.sleep(1)
    return True

def main():
    log("==================================================")
    log("🌕 ЗАПУСК АВТОМАТИЧЕСКОГО ФАРМА ЛУН (TARGET: >= 100)")
    log("==================================================")

    ensure_home_tab()

    tested_count = 0
    while True:
        root = dump_ui()
        moons = get_current_moons(root)
        log(f"💰 Текущий баланс: {moons} Moons")

        if moons is not None and moons >= 100:
            log("🎉 ЦЕЛЬ ДОСТИГНУТА! Баланс >= 100 Moons. Готовы ко вступлению в Pack!")
            break

        if tested_count >= 15:
            log("🛑 Лимит итераций (15 приложений) исчерпан за один сеанс.")
            break

        # Find app cards on screen
        cards = []
        if root:
            for node in root.iter("node"):
                desc = node.attrib.get("content-desc", "")
                if "Moons" in desc and "Add your app" not in desc:
                    b = parse_bounds(node.attrib.get("bounds", ""))
                    if b and b[1] >= 330 and b[3] <= 1400:
                        cards.append((desc.split("\n")[0], b[4], b[5]))

        if not cards:
            log("📜 Скроллим ленту вниз...")
            adb(["shell", "input", "swipe", "1280", "1200", "1280", "500", "300"])
            time.sleep(2)
            continue

        for app_title, cx, cy in cards:
            log(f"🎮 Проверяем приложение: {app_title}")
            try:
                farm_single_app(cx, cy)
                tested_count += 1
                ensure_home_tab()
            except Exception as e:
                log(f"❌ Ошибка при фарме {app_title}: {e}")
                ensure_home_tab()

            # Refresh balance
            r = dump_ui()
            m = get_current_moons(r)
            if m is not None:
                log(f"💰 Обновленный баланс: {m} Moons")
                if m >= 100:
                    break

        log("📜 Скроллим ленту дальше...")
        adb(["shell", "input", "swipe", "1280", "1200", "1280", "400", "300"])
        time.sleep(2)

    log("==================================================")
    log("🏁 ФАРМ ЛУН ЗАВЕРШЕН!")
    log("==================================================")

if __name__ == "__main__":
    main()
