#!/usr/bin/env python3
"""Discover official RSS links for editorial review, never confirmed incidents."""
import argparse
import datetime as dt
import email.utils
import json
import re
import sys
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from pathlib import Path

MAX_BYTES = 4 * 1024 * 1024
FEEDS = {
    "cisa": ("https://www.cisa.gov/cybersecurity-advisories/all.xml", "CISA", "cert", {"www.cisa.gov", "cisa.gov"}),
    "cloudflare": ("https://blog.cloudflare.com/tag/security/rss/", "Cloudflare", "vendor", {"blog.cloudflare.com"}),
}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def fetch(url):
    opener = urllib.request.build_opener(NoRedirect())
    req = urllib.request.Request(url, headers={"User-Agent": "ShadowOps-Cyber-Radar/1.0", "Accept": "application/rss+xml, application/xml, text/xml"})
    with opener.open(req, timeout=15) as response:
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("Feed too large")
    return data

def parse_feed(data, feed, start, end):
    if len(data) > MAX_BYTES:
        raise ValueError("Feed too large")
    # Accept UTF-8 only; reject DTD/entity declarations before XML parsing.
    xml = data.decode("utf-8-sig")
    if re.search(r"<!\s*(DOCTYPE|ENTITY)", xml, re.I):
        raise ValueError("DTD/entities forbidden")
    root = ET.fromstring(xml)
    channel = root.find("channel")
    if root.tag != "rss" or channel is None:
        raise ValueError("Expected RSS 2 channel")
    _, organization, kind, hosts = FEEDS[feed]
    result = {}
    items = channel.findall("item")
    if len(items) > 5000:
        raise ValueError("Too many RSS entries")
    for item in items:
        title = " ".join((item.findtext("title") or "").split())
        raw_url = (item.findtext("link") or "").strip()
        raw_date = (item.findtext("pubDate") or "").strip()
        published = email.utils.parsedate_to_datetime(raw_date)
        if published.tzinfo is None:
            raise ValueError("Missing timezone")
        day = published.astimezone(dt.timezone.utc).date()
        if not start <= day <= end:
            continue
        url = urllib.parse.urlsplit(raw_url)
        if (url.scheme != "https" or url.hostname not in hosts or url.username is not None or
                url.password is not None or url.port not in (None, 443) or len(raw_url) > 2048):
            raise ValueError("Unexpected feed entry URL")
        if not title or len(title) > 500:
            raise ValueError("Invalid feed title")
        link = url._replace(fragment="").geturl()
        record = {"organization": organization, "title": title,
                  "summary": "Entrada RSS oficial pendiente de lectura y verificación. El título no demuestra una brecha ni explotación.",
                  "sourceKind": kind, "proposedType": "watch", "publicationDate": day.isoformat(),
                  "incidentDate": None, "url": link}
        if link in result and result[link] != record:
            raise ValueError("Conflicting duplicate RSS entry")
        result[link] = record
    return sorted(result.values(), key=lambda x: (x["publicationDate"], x["url"]), reverse=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("start", type=dt.date.fromisoformat)
    parser.add_argument("end", type=dt.date.fromisoformat)
    parser.add_argument("--feed", choices=FEEDS, required=True)
    parser.add_argument("--local", type=Path, help="Offline RSS fixture")
    args = parser.parse_args()
    if args.start > args.end:
        parser.error("Inverted interval")
    try:
        if args.local:
            with args.local.open("rb") as handle:
                data = handle.read(MAX_BYTES + 1)
        else:
            data = fetch(FEEDS[args.feed][0])
        rows = parse_feed(data, args.feed, args.start, args.end)
        print(json.dumps(rows, ensure_ascii=False, indent=2))
    except (ValueError, TypeError, OverflowError, OSError, ET.ParseError) as exc:
        print(f"Discovery failed: {exc}", file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
