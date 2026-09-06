import sys
from pathlib import Path

# Add backend directory
backend_dir = str(Path(__file__).parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from agent import run_agent_loop, detect_input_language

def test_language_detection():
    print("--- 1. Testing Input Language Detection ---")
    
    # Hindi
    hi_input = "मुझे रामकुंड पर पवित्र स्नान करना है, गाड़ी कहाँ पार्क करूँ?"
    det_hi = detect_input_language(hi_input)
    print(f"Input: {hi_input}")
    print(f"Detected: {det_hi['name']} ({det_hi['locale']})")
    assert det_hi["lang"] == "hi", f"Expected 'hi', got {det_hi['lang']}"

    # Marathi
    mr_input = "मला रामकुंडाला स्नानासाठी जायचे आहे, गाडी कुठे पार्क करावी?"
    det_mr = detect_input_language(mr_input)
    print(f"\nInput: {mr_input}")
    print(f"Detected: {det_mr['name']} ({det_mr['locale']})")
    assert det_mr["lang"] == "mr", f"Expected 'mr', got {det_mr['lang']}"

    # English
    en_input = "I am coming from Mumbai by car, need full pilgrimage plan for Ramkund."
    det_en = detect_input_language(en_input)
    print(f"\nInput: {en_input}")
    print(f"Detected: {det_en['name']} ({det_en['locale']})")
    assert det_en["lang"] == "en", f"Expected 'en', got {det_en['lang']}"

    print("\n✓ Language detection tests PASSED!")

def test_multilingual_agent_loop():
    print("\n--- 2. Testing Multilingual Agent Planning ---")

    # Test Hindi
    print("\n[Testing Hindi Input]...")
    res_hi = run_agent_loop("मुझे रामकुंड पर पवित्र स्नान करना है, गाड़ी कहाँ पार्क करूँ?")
    print(f"Hindi Response Language Code: {res_hi.get('language_code')}")
    print(f"Hindi Summary: {res_hi.get('summary_text')}")
    assert res_hi.get("language_code") == "hi-IN", f"Expected hi-IN, got {res_hi.get('language_code')}"

    # Test Marathi
    print("\n[Testing Marathi Input]...")
    res_mr = run_agent_loop("मला रामकुंडाला स्नानासाठी जायचे आहे, गाडी कुठे पार्क करावी?")
    print(f"Marathi Response Language Code: {res_mr.get('language_code')}")
    print(f"Marathi Summary: {res_mr.get('summary_text')}")
    assert res_mr.get("language_code") == "mr-IN", f"Expected mr-IN, got {res_mr.get('language_code')}"

    # Test English
    print("\n[Testing English Input]...")
    res_en = run_agent_loop("Coming by car, want to visit Ramkund for holy snan.")
    print(f"English Response Language Code: {res_en.get('language_code')}")
    print(f"English Summary: {res_en.get('summary_text')}")
    assert res_en.get("language_code") == "en-IN", f"Expected en-IN, got {res_en.get('language_code')}"

    print("\n✓ ALL MULTILINGUAL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")
    test_language_detection()
    test_multilingual_agent_loop()
