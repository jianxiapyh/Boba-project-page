#!/usr/bin/env python3
"""Small dependency-free integrity check for the static project page."""

from __future__ import annotations

import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
EXPECTED_CODE_URL = "https://github.com/jianxiapyh/Boba-Public"
EXPECTED_FAVICON = "favicon.png"
EXPECTED_VIDEO_SOURCES = {
    "assets/Boba_3D_demo.mp4",
    "assets/planning/cloth-robot-view.mp4",
    "assets/planning/cloth-third-person.mp4",
    "assets/planning/rope-robot-view.mp4",
    "assets/planning/rope-third-person.mp4",
}
EXPECTED_VIDEO_POSTER = "assets/images/3d-demo-poster.jpg"
REQUIRED_SOURCE_IMAGES = {
    "assets/images/teaser.png",
    "assets/images/method.png",
    "assets/images/deployment-variants.png",
    "assets/images/throughput.png",
    "assets/images/deployment.png",
    "assets/images/fidelity.png",
    "assets/planning/cloth-target.png",
    "assets/planning/rope-target.png",
    "assets/images/mpc-accuracy.png",
    "assets/images/rl-training.png",
}


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.ids: list[str] = []
        self.links: list[str] = []
        self.images: list[dict[str, str]] = []
        self.icons: list[dict[str, str]] = []
        self.github_links: list[str] = []
        self.videos: list[dict[str, str]] = []
        self.media_sources: list[dict[str, str]] = []
        self.json_ld_blocks: list[str] = []
        self._in_json_ld = False
        self._json_ld_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if values.get("id"):
            self.ids.append(values["id"])

        if tag == "a" and values.get("href"):
            href = values["href"]
            self.links.append(href)
            if "github.com" in href:
                self.github_links.append(href)

        if tag == "img":
            self.images.append(values)

        if tag == "link" and values.get("rel") in {"icon", "apple-touch-icon"}:
            self.icons.append(values)

        if tag == "video":
            self.videos.append(values)

        if tag == "source" and values.get("src"):
            self.media_sources.append(values)

        if tag == "script" and values.get("type") == "application/ld+json":
            self._in_json_ld = True
            self._json_ld_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._in_json_ld:
            self.json_ld_blocks.append("".join(self._json_ld_parts))
            self._in_json_ld = False

    def handle_data(self, data: str) -> None:
        if self._in_json_ld:
            self._json_ld_parts.append(data)


def fail(message: str) -> None:
    raise SystemExit(f"ERROR: {message}")


def main() -> None:
    parser = SiteParser()
    parser.feed(INDEX.read_text(encoding="utf-8"))

    duplicate_ids = [item for item, count in Counter(parser.ids).items() if count > 1]
    if duplicate_ids:
        fail(f"duplicate HTML ids: {', '.join(duplicate_ids)}")

    id_set = set(parser.ids)
    for href in parser.links:
        if href.startswith("#"):
            target = unquote(href[1:])
            if target and target not in id_set:
                fail(f"missing fragment target: {href}")
            continue

        parsed = urlparse(href)
        if parsed.scheme or parsed.netloc:
            continue

        relative_path = unquote(parsed.path).lstrip("/")
        if relative_path and not (ROOT / relative_path).is_file():
            fail(f"missing local link target: {href}")

    for image in parser.images:
        src = image.get("src", "")
        if not src:
            fail("image without src")
        if not image.get("alt"):
            fail(f"image without alt text: {src}")
        if not image.get("width") or not image.get("height"):
            fail(f"image without intrinsic dimensions: {src}")
        if not (ROOT / src).is_file():
            fail(f"missing image: {src}")

    image_sources = {image["src"] for image in parser.images}
    missing_source_images = sorted(REQUIRED_SOURCE_IMAGES - image_sources)
    if missing_source_images:
        fail(f"camera-ready source image(s) not used: {', '.join(missing_source_images)}")

    if {icon.get("href", "") for icon in parser.icons} != {EXPECTED_FAVICON}:
        fail(f"unexpected favicon link(s): {parser.icons}")
    favicon = ROOT / EXPECTED_FAVICON
    favicon_bytes = favicon.read_bytes()
    if favicon_bytes[:8] != b"\x89PNG\r\n\x1a\n":
        fail("favicon is not a valid PNG file")
    favicon_size = tuple(int.from_bytes(favicon_bytes[offset : offset + 4], "big") for offset in (16, 20))
    if favicon_size != (256, 256):
        fail(f"unexpected favicon dimensions: {favicon_size}")

    if len(parser.videos) != len(EXPECTED_VIDEO_SOURCES):
        fail(f"expected exactly {len(EXPECTED_VIDEO_SOURCES)} demo videos")
    if not (ROOT / EXPECTED_VIDEO_POSTER).is_file():
        fail(f"missing video poster: {EXPECTED_VIDEO_POSTER}")

    if len(parser.media_sources) != len(EXPECTED_VIDEO_SOURCES):
        fail(f"expected exactly {len(EXPECTED_VIDEO_SOURCES)} media sources")

    actual_video_sources = {source.get("src", "") for source in parser.media_sources}
    if actual_video_sources != EXPECTED_VIDEO_SOURCES:
        fail(f"unexpected demo video source(s): {sorted(actual_video_sources)}")

    for video, media_source in zip(parser.videos, parser.media_sources, strict=True):
        source = media_source.get("src", "")
        if not video.get("aria-label"):
            fail(f"demo video is missing an accessible label: {source}")
        if media_source.get("type") != "video/mp4":
            fail(f"unexpected demo video type: {media_source}")
        if source == "assets/Boba_3D_demo.mp4" and video.get("poster") != EXPECTED_VIDEO_POSTER:
            fail(f"unexpected XR video poster: {video.get('poster', '')}")

        video_path = ROOT / source
        if not video_path.is_file() or video_path.read_bytes()[4:8] != b"ftyp":
            fail(f"demo video is not a valid MP4 file: {source}")

    if set(parser.github_links) != {EXPECTED_CODE_URL}:
        fail(f"unexpected GitHub link(s): {sorted(set(parser.github_links))}")

    if len(parser.json_ld_blocks) != 1:
        fail("expected exactly one JSON-LD block")
    json.loads(parser.json_ld_blocks[0])

    paper = ROOT / "assets" / "Boba_ECCV.pdf"
    if paper.read_bytes()[:5] != b"%PDF-":
        fail("accepted paper is not a valid PDF file")

    print(
        "Site integrity check passed: "
        f"{len(parser.links)} links, {len(parser.images)} images, "
        f"{len(parser.videos)} videos, {len(parser.ids)} unique ids."
    )


if __name__ == "__main__":
    main()
