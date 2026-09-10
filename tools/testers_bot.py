#!/usr/bin/env python3
"""
Testers Community Automation Bot for Detective Gang (Cunning Fox)
Автоматизирует процесс взаимного тестирования в Testers Community через ADB:
1. Находит приложения из списка Home
2. Открывает карточку и нажимает "Test Now" -> "Install the app"
3. Устанавливает из Google Play Store и запускает на 35 секунд
4. Возвращается в Testers Community и подтверждает выполнение
5. При достижении баланса 60+ Moons может автоматически опубликовать Detective Gang
"""

import os
import re
import shutil
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

# Путь к ADB
ADB_CANDIDATES = [
    "/opt/homebrew/share/android-commandlinetools/platform-tools/adb",
    shutil.which("adb") or "",
    os.path.expanduser("~/Library/Android/sdk/platform-tools/adb"),
]

def get_adb():
    for p in ADB_CANDIDATES:
        if p and os.path.exists(p) and os.access(p, os.X_OK):
            return p
    return "adb"

ADB = get_adb()
PKG_TESTERS = "com.testerscommunity"
PKG_PLAYSTORE = "com.android.vending"

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def adb_cmd(args, timeout=30):
    cmd = [ADB] + args
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return res.stdout.strip()
    except Exception as e:
        log(f"[ADB Error] {' '.join(cmd)}: {e}")
        return ""

def tap(x, y):
    log(f"👉 Клик: ({x}, {y})")
    adb_cmd(["shell", "input", "tap", str(x), str(y)])

def back():
    log("⬅️ Назад (Back)")
    adb_cmd(["shell", "input", "keyevent", "4"])

def dump_ui():
    """Снимает и парсит XML иерархии текущего экрана."""
    adb_cmd(["shell", "uiautomator", "dump", "/sdcard/ui_dump.xml"])
    xml_str = adb_cmd(["shell", "cat", "/sdcard/ui_dump.xml"])
    if not xml_str or not xml_str.startswith("<?xml"):
        time.sleep(1)
        xml_str = adb_cmd(["shell", "cat", "/sdcard/ui_dump.xml"])
    try:
        return ET.fromstring(xml_str)
    except Exception as e:
        log(f"[XML Parse Error]: {e}")
        return None

def parse_bounds(bounds_str):
    """Преобразует строку '[x1,y1][x2,y2]' в координаты центра (cx, cy)."""
    match = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds_str)
    if match:
        x1, y1, x2, y2 = map(int, match.groups())
        return (x1 + x2) // 2, (y1 + y2) // 2
    return None

def find_nodes(root, text_pattern=None, desc_pattern=None, class_name=None):
    """Ищет узлы по регулярному выражению в text или content-desc."""
    results = []
    if root is None:
        return results
    for node in root.iter("node"):
        text = node.attrib.get("text", "")
        desc = node.attrib.get("content-desc", "")
        cls = node.attrib.get("class", "")

        match_text = True if not text_pattern else bool(re.search(text_pattern, text, re.I))
        match_desc = True if not desc_pattern else bool(re.search(desc_pattern, desc, re.I))
        match_cls = True if not class_name else (cls == class_name)

        if match_text and match_desc and match_cls:
            results.append(node)
    return results

def get_moon_balance(root=None):
    if root is None:
        root = dump_ui()
    nodes = find_nodes(root, desc_pattern=r"^\d+$")
    for n in nodes:
        try:
            val = int(n.attrib.get("content-desc", ""))
            return val
        except ValueError:
            pass
    return None

def open_testers_community():
    log("🚀 Открываем Testers Community...")
    adb_cmd(["shell", "monkey", "-p", PKG_TESTERS, "-c", "android.intent.category.LAUNCHER", "1"])
    time.sleep(2)

def go_to_tab(tab_name="Home"):
    root = dump_ui()
    nodes = find_nodes(root, desc_pattern=rf"^{tab_name}\b")
    if nodes:
        cx, cy = parse_bounds(nodes[0].attrib.get("bounds", ""))
        tap(cx, cy)
        time.sleep(1.5)
        return True
    return False

def ensure_home():
    """Возвращается на главный экран ленты приложений."""
    log("🏠 Переход на главную страницу (Home)...")
    # Пробуем нажать на таб Home внизу (обычно bounds [0, 1396][640, 1536])
    root = dump_ui()
    home_tab = find_nodes(root, desc_pattern=r"^Home\b")
    if home_tab:
        cx, cy = parse_bounds(home_tab[0].attrib.get("bounds", ""))
        tap(cx, cy)
        time.sleep(1.5)
        return True
    
    # Если таба нет, нажимаем back один раз и ищем таб
    back()
    time.sleep(1.5)
    root = dump_ui()
    home_tab = find_nodes(root, desc_pattern=r"^Home\b")
    if home_tab:
        cx, cy = parse_bounds(home_tab[0].attrib.get("bounds", ""))
        tap(cx, cy)
        time.sleep(1.5)
        return True
    return False

def handle_play_store_install():
    """Обрабатывает экран Google Play Store: нажимает Install, ждет завершения, открывает."""
    log("🛒 Ожидаем Google Play Store или диалог установки...")
    for _ in range(10):
        root = dump_ui()
        install_btns = find_nodes(root, text_pattern=r"^(Install|Установить)$", desc_pattern=r"^(Install|Установить)$")
        open_btns = find_nodes(root, text_pattern=r"^(Open|Открыть|Play|Играть)$", desc_pattern=r"^(Open|Открыть|Play|Играть)$")

        if open_btns:
            log("✅ Приложение уже установлено или готово к открытию!")
            cx, cy = parse_bounds(open_btns[0].attrib.get("bounds", ""))
            tap(cx, cy)
            return True

        if install_btns:
            log("📥 Нажимаем 'Install' в Play Store...")
            cx, cy = parse_bounds(install_btns[0].attrib.get("bounds", ""))
            tap(cx, cy)
            break
        time.sleep(2)

    log("⏳ Ожидание скачивания и запуска (до 45 сек)...")
    for _ in range(15):
        time.sleep(3)
        root = dump_ui()
        open_btns = find_nodes(root, text_pattern=r"^(Open|Открыть|Play|Играть)$")
        if open_btns:
            log("🚀 Приложение установлено! Запускаем...")
            cx, cy = parse_bounds(open_btns[0].attrib.get("bounds", ""))
            tap(cx, cy)
            return True
    log("ℹ️ Завершили ожидание Play Store.")
    return True

def test_single_app(app_desc):
    """Выполняет цикл тестирования для одного приложения."""
    title = app_desc.splitlines()[0] if app_desc else "App"
    log(f"\n📱 === Начинаем тест: {title} ===")
    root = dump_ui()
    nodes = find_nodes(root, desc_pattern=re.escape(app_desc))
    if not nodes:
        log("❌ Не удалось найти карточку приложения на экране.")
        return False

    cx, cy = parse_bounds(nodes[0].attrib.get("bounds", ""))
    tap(cx, cy)
    time.sleep(2)

    # Нажимаем Test Now
    root = dump_ui()
    test_now_nodes = find_nodes(root, desc_pattern=r"^Test Now$")
    if test_now_nodes:
        cx, cy = parse_bounds(test_now_nodes[0].attrib.get("bounds", ""))
        tap(cx, cy)
        time.sleep(2)

    # В модалке нажимаем "Install the app"
    root = dump_ui()
    install_nodes = find_nodes(root, desc_pattern=r"^Install the app$")
    if install_nodes:
        cx, cy = parse_bounds(install_nodes[0].attrib.get("bounds", ""))
        tap(cx, cy)
        time.sleep(3)

    # Обрабатываем установку в Play Store
    handle_play_store_install()

    log("⏱ Держим приложение активным 35 секунд...")
    time.sleep(35)

    # Возвращаемся в Testers Community
    open_testers_community()
    time.sleep(2)

    # Проверяем шаг подтверждения / обратной связи
    root = dump_ui()
    confirm_btns = find_nodes(root, desc_pattern=r"^(Done|Claim|Close|Leave feedback|I have installed)$")
    for btn in confirm_btns:
        cx, cy = parse_bounds(btn.attrib.get("bounds", ""))
        tap(cx, cy)
        time.sleep(1)

    back()
    time.sleep(1)
    back()
    time.sleep(1)
    return True

def publish_detective_gang():
    """Публикует Detective Gang в Community Testing."""
    log("\n🎯 Публикация Detective Gang в Community Testing...")
    go_to_tab("Home")
    time.sleep(2)
    root = dump_ui()
    add_nodes = find_nodes(root, desc_pattern=r"Add your app to this list")
    if add_nodes:
        cx, cy = parse_bounds(add_nodes[0].attrib.get("bounds", ""))
        tap(cx, cy)
        time.sleep(2)
        root = dump_ui()
        dg_lib_nodes = find_nodes(root, desc_pattern=r"Detective Gang")
        if dg_lib_nodes:
            cx, cy = parse_bounds(dg_lib_nodes[0].attrib.get("bounds", ""))
            tap(cx, cy)
            time.sleep(2)
            root = dump_ui()
            comm_nodes = find_nodes(root, desc_pattern=r"Community Testing")
            if comm_nodes:
                cx, cy = parse_bounds(comm_nodes[0].attrib.get("bounds", ""))
                tap(cx, cy)
                time.sleep(1)
                submit_nodes = find_nodes(root, desc_pattern=r"(Publish|Confirm|Start|Buy)")
                if submit_nodes:
                    cx, cy = parse_bounds(submit_nodes[0].attrib.get("bounds", ""))
                    tap(cx, cy)
                    log("🎉 Detective Gang успешно опубликован на тестирование!")
                    return True
    return False

def main():
    log("=== Testers Community Automation Bot ===")
    log(f"Используется ADB: {ADB}")
    
    open_testers_community()
    ensure_home()
    
    root = dump_ui()
    balance = get_moon_balance(root)
    log(f"🌙 Текущий баланс: {balance} Moons")
    
    if balance is not None and balance >= 60:
        log("✅ Баланса уже достаточно для публикации (>= 60 Moons)!")
        publish_detective_gang()
        return

    nodes = find_nodes(root, desc_pattern=r"\b\d+\s+Moons\b")
    log(f"📋 Найдено приложений для теста: {len(nodes)}")
    
    for n in nodes:
        desc = n.attrib.get("content-desc", "")
        test_single_app(desc)
        
        open_testers_community()
        ensure_home()
        root = dump_ui()
        bal = get_moon_balance(root)
        log(f"🌙 Баланс после теста: {bal} Moons")
        if bal is not None and bal >= 60:
            log("🎉 Набрано 60+ монет! Переходим к публикации...")
            publish_detective_gang()
            break

if __name__ == "__main__":
    main()
