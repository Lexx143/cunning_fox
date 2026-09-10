#!/usr/bin/env python3
import subprocess
import time
import xml.etree.ElementTree as ET
import re
import sys

ADB = "/opt/homebrew/share/android-commandlinetools/platform-tools/adb"

def run_adb(cmd):
    if isinstance(cmd, str):
        full_cmd = f"{ADB} {cmd}"
        res = subprocess.run(full_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    else:
        full_cmd = [ADB] + cmd
        res = subprocess.run(full_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.stdout.strip()

def tap(x, y):
    print(f"[*] Tapping ({x}, {y})")
    run_adb(f"shell input tap {x} {y}")

def swipe(x1, y1, x2, y2, duration=300):
    print(f"[*] Swiping ({x1}, {y1}) -> ({x2}, {y2})")
    run_adb(f"shell input swipe {x1} {y1} {x2} {y2} {duration}")

def back():
    print("[*] Pressing BACK")
    run_adb("shell input keyevent 4")

def bring_testers_front():
    run_adb("shell am start -n com.testerscommunity/.MainActivity")
    time.sleep(2)

def dump_ui():
    run_adb("shell uiautomator dump /sdcard/ui.xml")
    xml_str = run_adb("shell cat /sdcard/ui.xml")
    if not xml_str or "<hierarchy" not in xml_str:
        return None
    try:
        idx = xml_str.find("<hierarchy")
        if idx != -1:
            xml_str = xml_str[idx:]
        return ET.fromstring(xml_str)
    except Exception as e:
        print(f"[!] Error parsing XML: {e}")
        return None

def find_nodes(root, match_fn):
    matches = []
    if root is None:
        return matches
    for elem in root.iter():
        if match_fn(elem):
            matches.append(elem)
    return matches

def parse_bounds(bounds_str):
    if not bounds_str:
        return None
    m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', bounds_str)
    if m:
        x1, y1, x2, y2 = map(int, m.groups())
        return x1, y1, x2, y2, (x1 + x2) // 2, (y1 + y2) // 2
    return None

def get_moon_balance(root):
    if root is None:
        return None
    for elem in root.iter():
        desc = elem.attrib.get("content-desc", "")
        if re.match(r'^-?\d+$', desc):
            try:
                b = parse_bounds(elem.attrib.get("bounds", ""))
                if b and b[1] < 200 and b[0] > 2000:
                    return int(desc)
            except:
                pass
    return None

def ensure_home_tab():
    bring_testers_front()
    # If on some sub-page, back out to Home
    for _ in range(3):
        root = dump_ui()
        if root is None:
            continue
        home_tab = find_nodes(root, lambda e: "Home\nTab 1 of 4" in e.attrib.get("content-desc", ""))
        if home_tab:
            b = parse_bounds(home_tab[0].attrib.get("bounds"))
            tap(b[4], b[5])
            time.sleep(2)
            break
        else:
            back()
            time.sleep(1)

def test_single_app(app_name, card_x, card_y):
    print(f"\n==========================================")
    print(f"[+] Starting test process for: {app_name}")
    print(f"==========================================")
    
    # 1. Tap card
    tap(card_x, card_y)
    time.sleep(3)
    
    # 2. Check if App Details opened
    root = dump_ui()
    test_now_nodes = find_nodes(root, lambda e: e.attrib.get("content-desc") == "Test Now" or "Test Now" in e.attrib.get("text", ""))
    if not test_now_nodes:
        print(f"[!] 'Test Now' not found for {app_name}. Going back.")
        back()
        time.sleep(2)
        return False
        
    b = parse_bounds(test_now_nodes[0].attrib.get("bounds"))
    tap(b[4], b[5])
    time.sleep(3)
    
    # 3. Step A: Install the app
    installed_successfully = False
    for attempt in range(2):
        root = dump_ui()
        if root is None:
            break
            
        ive_installed = find_nodes(root, lambda e: "I've installed it" in e.attrib.get("content-desc", "") or "I've installed it" in e.attrib.get("text", ""))
        if ive_installed:
            ib = parse_bounds(ive_installed[0].attrib.get("bounds"))
            tap(ib[4], ib[5])
            time.sleep(2)
            installed_successfully = True
            break
            
        # Tap Install the app button inside modal
        inst_btn = find_nodes(root, lambda e: e.attrib.get("clickable") == "true" and "Install the app" in e.attrib.get("content-desc", ""))
        if inst_btn:
            eb = parse_bounds(inst_btn[0].attrib.get("bounds"))
            tap(eb[4], eb[5])
            time.sleep(4)
        else:
            # Try finding any blue button in the top half of modal
            clickables = find_nodes(root, lambda e: e.attrib.get("clickable") == "true")
            for c in clickables:
                eb = parse_bounds(c.attrib.get("bounds"))
                if eb and 500 <= eb[1] <= 850 and 700 <= eb[0] <= 1900:
                    tap(eb[4], eb[5])
                    time.sleep(4)
                    break
        
        # Check Play Store
        ps_root = dump_ui()
        if ps_root is not None:
            # Check for Item not found / Try again
            try_again = find_nodes(ps_root, lambda e: "Try again" in e.attrib.get("text", "") or "Item not found" in e.attrib.get("text", ""))
            if try_again:
                print(f"[!] {app_name} is 'Item not found' in Play Store.")
                bring_testers_front()
                time.sleep(2)
                break
                
            ps_inst = find_nodes(ps_root, lambda e: e.attrib.get("content-desc") == "Install" or e.attrib.get("text") == "Install")
            if ps_inst:
                p_bound = None
                for elem in ps_root.iter():
                    for child in elem:
                        if child in ps_inst:
                            p_bound = parse_bounds(elem.attrib.get("bounds"))
                            break
                if p_bound:
                    print(f"[*] Play Store Install button at {p_bound[4]}, {p_bound[5]}")
                    tap(p_bound[4], p_bound[5])
                else:
                    ib = parse_bounds(ps_inst[0].attrib.get("bounds"))
                    tap(ib[4], ib[5])
                
                print("[*] Waiting for Play Store installation...")
                for _ in range(25):
                    time.sleep(3)
                    chk_root = dump_ui()
                    if chk_root is None:
                        continue
                    pp_notnow = find_nodes(chk_root, lambda e: "Not now" in e.attrib.get("text", "") or "Not now" in e.attrib.get("content-desc", ""))
                    if pp_notnow:
                        npb = parse_bounds(pp_notnow[0].attrib.get("bounds"))
                        tap(npb[4], npb[5])
                        time.sleep(2)
                    opn = find_nodes(chk_root, lambda e: e.attrib.get("text") == "Open" or e.attrib.get("content-desc") == "Open")
                    if opn:
                        print("[+] App installed successfully in Play Store!")
                        installed_successfully = True
                        break
            else:
                # Check if Open / Uninstall already exists (already installed)
                opn = find_nodes(ps_root, lambda e: e.attrib.get("text") == "Open" or e.attrib.get("content-desc") == "Open")
                if opn:
                    print("[+] App was already installed!")
                    installed_successfully = True
                    
        bring_testers_front()
        time.sleep(2)
        root = dump_ui()
        ive_installed = find_nodes(root, lambda e: "I've installed it" in e.attrib.get("content-desc", "") or "I've installed it" in e.attrib.get("text", ""))
        if ive_installed:
            ib = parse_bounds(ive_installed[0].attrib.get("bounds"))
            tap(ib[4], ib[5])
            time.sleep(2)
            installed_successfully = True
            break
        elif len(find_nodes(root, lambda e: e.attrib.get("content-desc") == "Done")) >= 1:
            installed_successfully = True
            break

    if not installed_successfully:
        print(f"[!] Could not install {app_name}. Aborting app test.")
        back()
        time.sleep(1)
        back()
        time.sleep(1)
        return False

    # Step B: Use for at least 30 seconds
    root = dump_ui()
    open_nodes = find_nodes(root, lambda e: "Open App" in e.attrib.get("content-desc", "") or "Open App" in e.attrib.get("text", ""))
    if open_nodes:
        ob = parse_bounds(open_nodes[0].attrib.get("bounds"))
        tap(ob[4], ob[5])
        print("[*] App opened. Testing for 35 seconds...")
        for _ in range(7):
            time.sleep(5)
            run_adb("shell input tap 1280 800")
        bring_testers_front()
        time.sleep(2)
        
    # Step C: Leave feedback
    root = dump_ui()
    for elem in (root.iter() if root else []):
        if elem.attrib.get("clickable") == "true":
            eb = parse_bounds(elem.attrib.get("bounds"))
            if eb and 800 <= eb[1] <= 1200:
                desc = elem.attrib.get("content-desc", "")
                if "Feedback" in desc or "feedback" in desc:
                    tap(eb[4], eb[5])
                    time.sleep(3)
                    bring_testers_front()
                    time.sleep(2)
                    break
                    
    # Step D: Complete
    for _ in range(3):
        root = dump_ui()
        comp_nodes = find_nodes(root, lambda e: e.attrib.get("content-desc") == "Complete" or e.attrib.get("text") == "Complete")
        if comp_nodes:
            cb = parse_bounds(comp_nodes[0].attrib.get("bounds"))
            tap(cb[4], cb[5])
            time.sleep(3)
            print(f"[+] Successfully completed testing for {app_name} and claimed moons!")
            return True
        else:
            swipe(1280, 1200, 1280, 700, 300)
            time.sleep(2)
            
    print("[!] Could not complete all steps. Returning to Home.")
    back()
    time.sleep(1)
    back()
    time.sleep(1)
    return False

def main():
    ensure_home_tab()
    
    root = dump_ui()
    balance = get_moon_balance(root)
    print(f"[*] Current Moon Balance: {balance}")
    
    tested_names = set()
    scroll_count = 0
    
    while scroll_count < 10:
        if balance is not None and balance >= 100:
            print("[+] Reached target moon balance >= 100!")
            break
            
        root = dump_ui()
        cards = []
        for elem in (root.iter() if root else []):
            desc = elem.attrib.get("content-desc", "")
            if "Moons" in desc and "\n" in desc:
                b = parse_bounds(elem.attrib.get("bounds"))
                if b and b[1] >= 340 and b[3] <= 1400:
                    name = desc.split("\n")[0].strip()
                    if name not in tested_names:
                        cards.append((name, b[4], b[5]))
                    
        print(f"[*] Found {len(cards)} new app cards on screen: {[c[0] for c in cards]}")
        if not cards:
            print("[*] Scrolling down to find more apps...")
            swipe(1280, 1200, 1280, 500, 400)
            time.sleep(3)
            scroll_count += 1
            root = dump_ui()
            balance = get_moon_balance(root)
            continue
            
        for name, cx, cy in cards:
            tested_names.add(name)
            res = test_single_app(name, cx, cy)
            ensure_home_tab()
            root = dump_ui()
            balance = get_moon_balance(root)
            print(f"[*] Current Moon Balance: {balance}")
            if balance is not None and balance >= 100:
                print("[+] Reached target moon balance >= 100!")
                break

if __name__ == "__main__":
    main()
