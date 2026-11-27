import datetime as dt
import importlib.util
import unittest
import subprocess
import sys
import tempfile
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("discover_rss", ROOT / "scripts/discover-rss.py")
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)
START, END = dt.date(2026, 11, 21), dt.date(2026, 11, 27)

def item(link="https://www.cisa.gov/news-events/cybersecurity-advisories/aa26-001a", day="Fri, 27 Nov 2026 10:00:00 GMT", title="Security &amp; update"):
    return f"<item><title>{title}</title><link>{link}</link><pubDate>{day}</pubDate></item>"

def rss(*items):
    return ("<rss version='2.0'><channel>" + "".join(items) + "</channel></rss>").encode()

class DiscoveryTests(unittest.TestCase):
    def test_date_window_and_pending_only(self):
        rows = mod.parse_feed(rss(item(), item(day="Fri, 20 Nov 2026 10:00:00 GMT")), "cisa", START, END)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["title"], "Security & update")
        self.assertEqual(rows[0]["proposedType"], "watch")
        self.assertIsNone(rows[0]["incidentDate"])
    def test_source_and_xml_validation(self):
        for data in (rss(item(link="https://evil.example/")), rss(item(link="https://user@www.cisa.gov/a")), b"<!DOCTYPE rss [<!ENTITY x 'x'>]><rss/>", b"<html/>"):
            with self.assertRaises(ValueError):
                mod.parse_feed(data, "cisa", START, END)
    def test_duplicate_and_conflict(self):
        self.assertEqual(len(mod.parse_feed(rss(item(), item()), "cisa", START, END)), 1)
        with self.assertRaises(ValueError):
            mod.parse_feed(rss(item(), item(title="Different")), "cisa", START, END)
    def test_cloudflare_allowlist(self):
        rows = mod.parse_feed(rss(item(link="https://blog.cloudflare.com/security-post/")), "cloudflare", START, END)
        self.assertEqual(rows[0]["sourceKind"], "vendor")
        self.assertEqual(rows[0]["organization"], "Cloudflare")
    def test_cli_offline(self):
        with tempfile.TemporaryDirectory() as tmp:
            feed = Path(tmp) / "feed.xml"
            feed.write_bytes(rss(item()))
            cmd = [sys.executable, str(ROOT / "scripts/discover-rss.py"), str(START), str(END), "--feed", "cisa", "--local", str(feed)]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertEqual(len(json.loads(proc.stdout)), 1)
            feed.write_bytes(b"<html/>")
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            self.assertNotEqual(proc.returncode, 0)
            self.assertEqual(proc.stdout, "")

if __name__ == "__main__":
    unittest.main()
