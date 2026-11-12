from __future__ import annotations

import json
import os
from html import escape
from pathlib import Path
from typing import Any

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import (
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
except ModuleNotFoundError as exc:
    if exc.name and exc.name.split(".", maxsplit=1)[0] == "reportlab":
        raise SystemExit(
            "Missing PDF dependency: ReportLab. "
            "Run `python3 -m pip install -r requirements-resume.txt` first."
        ) from exc
    raise


ROOT = Path(__file__).resolve().parents[1]
PROFILE_PATH = ROOT / "apps" / "portfolio" / "src" / "data" / "profile.json"
OUTPUT = ROOT / "output" / "pdf" / "resume-public.pdf"

REGULAR_FONT_CANDIDATES = (
    Path("/Library/Fonts/Microsoft/Microsoft Yahei.ttf"),
    Path("/Library/Fonts/Microsoft/Microsoft YaHei.ttf"),
    Path("/System/Library/Fonts/PingFang.ttc"),
    Path("/System/Library/Fonts/STHeiti Light.ttc"),
    Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
    Path("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"),
)
BOLD_FONT_CANDIDATES = (
    Path("/Library/Fonts/Microsoft/SimHei.ttf"),
    Path("/Library/Fonts/Microsoft/Microsoft Yahei Bold.ttf"),
    Path("/Library/Fonts/Microsoft/Microsoft YaHei Bold.ttf"),
    Path("/System/Library/Fonts/PingFang.ttc"),
    Path("/System/Library/Fonts/STHeiti Medium.ttc"),
    Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"),
    Path("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"),
)


def load_profile() -> dict[str, Any]:
    try:
        profile = json.loads(PROFILE_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise FileNotFoundError(f"Resume profile not found: {PROFILE_PATH}") from exc
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Invalid JSON in {PROFILE_PATH}:{exc.lineno}:{exc.colno}: {exc.msg}"
        ) from exc

    required_fields = (
        "name",
        "headline",
        "headlineEn",
        "summary",
        "availability",
        "strengths",
        "experience",
        "education",
        "skills",
        "selfEvaluation",
        "contact",
        "document",
    )
    missing = [field for field in required_fields if field not in profile]
    if missing:
        raise ValueError(f"Resume profile is missing required fields: {', '.join(missing)}")

    if not isinstance(profile["experience"], list) or not profile["experience"]:
        raise ValueError("Resume profile must contain at least one experience entry")

    missing_contact_fields = [
        field for field in ("github", "email", "phone") if not profile["contact"].get(field)
    ]
    if missing_contact_fields:
        raise ValueError(
            "Resume profile contact is missing: "
            f"{', '.join(missing_contact_fields)}"
        )

    for index, experience in enumerate(profile["experience"], start=1):
        missing_experience_fields = [
            field
            for field in ("company", "role", "start", "end", "period", "overview", "highlights")
            if field not in experience
        ]
        if missing_experience_fields:
            raise ValueError(
                "Experience entry "
                f"{index} is missing: {', '.join(missing_experience_fields)}"
            )

    return profile


def _font_candidates(
    environment_name: str,
    defaults: tuple[Path, ...],
) -> list[tuple[str, Path]]:
    candidates: list[tuple[str, Path]] = []
    configured = os.environ.get(environment_name, "").strip()
    if configured:
        candidates.append((environment_name, Path(configured).expanduser()))

    candidates.extend(("built-in candidate", path) for path in defaults)

    unique: list[tuple[str, Path]] = []
    seen: set[Path] = set()
    for source, path in candidates:
        normalized = path.resolve(strict=False)
        if normalized in seen:
            continue
        seen.add(normalized)
        unique.append((source, path))
    return unique


def _register_font(
    font_name: str,
    environment_name: str,
    defaults: tuple[Path, ...],
) -> Path:
    attempts: list[str] = []

    for source, path in _font_candidates(environment_name, defaults):
        if not path.is_file():
            attempts.append(f"- {source}: {path} (not found)")
            continue

        try:
            pdfmetrics.registerFont(TTFont(font_name, str(path)))
        except Exception as exc:  # ReportLab exposes several font parser exceptions.
            attempts.append(f"- {source}: {path} ({type(exc).__name__}: {exc})")
            continue

        return path

    checked = "\n".join(attempts) if attempts else "- no candidates configured"
    raise RuntimeError(
        f"Could not register {font_name}. Checked:\n{checked}\n"
        f"Set {environment_name} to a readable Chinese TrueType/OpenType font file."
    )


def register_fonts() -> tuple[Path, Path]:
    regular_path = _register_font(
        "ResumeSans",
        "RESUME_FONT_REGULAR",
        REGULAR_FONT_CANDIDATES,
    )
    bold_path = _register_font(
        "ResumeSans-Bold",
        "RESUME_FONT_BOLD",
        BOLD_FONT_CANDIDATES,
    )
    pdfmetrics.registerFontFamily(
        "ResumeSans",
        normal="ResumeSans",
        bold="ResumeSans-Bold",
        italic="ResumeSans",
        boldItalic="ResumeSans-Bold",
    )
    return regular_path, bold_path


def build_styles() -> dict[str, ParagraphStyle]:
    sample = getSampleStyleSheet()

    base = ParagraphStyle(
        "Base",
        parent=sample["BodyText"],
        fontName="ResumeSans",
        fontSize=8.7,
        leading=12.2,
        textColor=colors.HexColor("#242424"),
        wordWrap="CJK",
        spaceAfter=2,
    )
    return {
        "name": ParagraphStyle(
            "Name",
            parent=base,
            fontName="ResumeSans-Bold",
            fontSize=23,
            leading=27,
            alignment=TA_CENTER,
            spaceAfter=3,
        ),
        "headline": ParagraphStyle(
            "Headline",
            parent=base,
            fontSize=10.2,
            leading=14,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#434343"),
            spaceAfter=8,
        ),
        "body": base,
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base,
            leftIndent=11,
            firstLineIndent=-9,
            spaceAfter=1.5,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=base,
            fontName="ResumeSans-Bold",
            fontSize=13.2,
            leading=17,
            textColor=colors.HexColor("#161616"),
            spaceAfter=0,
        ),
        "job": ParagraphStyle(
            "Job",
            parent=base,
            fontName="ResumeSans-Bold",
            fontSize=10.7,
            leading=14,
            spaceAfter=0,
        ),
        "date": ParagraphStyle(
            "Date",
            parent=base,
            fontName="ResumeSans-Bold",
            fontSize=9.2,
            leading=14,
            alignment=TA_RIGHT,
            textColor=colors.HexColor("#4f4f4f"),
            spaceAfter=0,
        ),
        "role": ParagraphStyle(
            "Role",
            parent=base,
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#555555"),
            spaceAfter=3,
        ),
        "subhead": ParagraphStyle(
            "Subhead",
            parent=base,
            fontName="ResumeSans-Bold",
            fontSize=9.4,
            leading=12.5,
            spaceBefore=3,
            spaceAfter=1,
        ),
        "note": ParagraphStyle(
            "Note",
            parent=base,
            fontSize=7.2,
            leading=10,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#777777"),
        ),
    }


def plain_text(value: Any) -> str:
    return escape(str(value), quote=False)


def section(title: str, styles: dict[str, ParagraphStyle], width: float) -> Table:
    table = Table([[Paragraph(plain_text(title), styles["section"])]], colWidths=[width])
    table.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                ("LINEBELOW", (0, 0), (-1, -1), 0.55, colors.HexColor("#cfcfcf")),
            ]
        )
    )
    return table


def job_header(
    company: str,
    period: str,
    role: str,
    styles: dict[str, ParagraphStyle],
    width: float,
) -> list[Any]:
    table = Table(
        [
            [
                Paragraph(plain_text(company), styles["job"]),
                Paragraph(plain_text(period), styles["date"]),
            ]
        ],
        colWidths=[width * 0.72, width * 0.28],
    )
    table.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    return [table, Paragraph(f"职位：{plain_text(role)}", styles["role"])]


def bullet(text: str, styles: dict[str, ParagraphStyle]) -> Paragraph:
    return Paragraph(f"• {plain_text(text)}", styles["bullet"])


def make_footer(note: str, website: str):
    def footer(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont("ResumeSans", 7)
        canvas.setFillColor(colors.HexColor("#8a8a8a"))
        canvas.drawString(doc.leftMargin, 13 * mm, note)
        canvas.drawCentredString(A4[0] / 2, 13 * mm, website)
        canvas.drawRightString(A4[0] - doc.rightMargin, 13 * mm, f"{doc.page}")
        canvas.restoreState()

    return footer


def build_resume() -> None:
    profile = load_profile()
    regular_font, bold_font = register_fonts()
    styles = build_styles()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    document = profile["document"]
    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=17 * mm,
        rightMargin=17 * mm,
        topMargin=13 * mm,
        bottomMargin=19 * mm,
        title=document["title"],
        author=document["author"],
        subject=document["subject"],
    )
    width = A4[0] - doc.leftMargin - doc.rightMargin
    story: list[Any] = []

    headline = (
        f"{plain_text(profile['headline'])}"
        f" &nbsp;&nbsp;|&nbsp;&nbsp; {plain_text(profile['headlineEn'])}"
    )
    story.extend(
        [
            Paragraph(plain_text(profile["name"]), styles["name"]),
            Paragraph(headline, styles["headline"]),
            section("个人信息", styles, width),
            Spacer(1, 3),
        ]
    )

    for education in profile["education"]:
        education_text = " / ".join(
            part
            for part in (
                education.get("degree", ""),
                education.get("school", ""),
                education.get("major", ""),
            )
            if part
        )
        story.append(bullet(education_text, styles))
    story.append(bullet(profile["availability"], styles))

    story.extend([Spacer(1, 3), section("个人简介", styles, width), Spacer(1, 3)])
    story.extend(Paragraph(plain_text(text), styles["body"]) for text in profile["summary"])

    story.extend([Spacer(1, 3), section("核心能力", styles, width), Spacer(1, 3)])
    story.extend(bullet(text, styles) for text in profile["strengths"])

    story.extend([Spacer(1, 3), section("技术栈", styles, width), Spacer(1, 3)])
    for skill_group in profile["skills"]:
        items = " / ".join(skill_group["items"])
        story.append(bullet(f"{skill_group['label']}：{items}", styles))

    story.extend([Spacer(1, 4), section("工作经历", styles, width), Spacer(1, 4)])
    experiences = profile["experience"]
    for index, experience in enumerate(experiences):
        story.extend(
            job_header(
                experience["company"],
                experience["period"],
                experience["role"],
                styles,
                width,
            )
        )
        if experience["overview"]:
            story.append(Paragraph(plain_text(experience["overview"]), styles["body"]))

        for highlight in experience["highlights"]:
            if highlight["title"]:
                story.append(Paragraph(plain_text(highlight["title"]), styles["subhead"]))
            story.extend(bullet(text, styles) for text in highlight["bullets"])

        if experience.get("pageBreakAfter"):
            story.append(PageBreak())
        elif index < len(experiences) - 1:
            story.append(Spacer(1, 5))

    story.extend([Spacer(1, 5), section("自我评价", styles, width), Spacer(1, 3)])
    story.extend(bullet(text, styles) for text in profile["selfEvaluation"])

    contact = profile["contact"]
    contact_text = (
        f"Phone: {plain_text(contact['phone'])}"
        f" &nbsp;|&nbsp; Email: {plain_text(contact['email'])}"
        f" &nbsp;|&nbsp; GitHub: {plain_text(contact['github'])}"
        f" &nbsp;|&nbsp; More: {plain_text(contact['website'])}"
    )
    story.extend([Spacer(1, 5), Paragraph(contact_text, styles["note"])])

    footer = make_footer(document["footer"], contact["website"])
    print(f"Using regular font: {regular_font}")
    print(f"Using bold font: {bold_font}")
    print(f"Writing resume to: {OUTPUT}")
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build_resume()
