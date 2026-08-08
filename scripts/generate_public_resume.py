from pathlib import Path

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


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "resume-public.pdf"
FONT_REGULAR_PATH = "/Library/Fonts/Microsoft/Microsoft Yahei.ttf"
FONT_BOLD_PATH = "/Library/Fonts/Microsoft/SimHei.ttf"


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("ResumeSans", FONT_REGULAR_PATH))
    pdfmetrics.registerFont(TTFont("ResumeSans-Bold", FONT_BOLD_PATH))
    pdfmetrics.registerFontFamily(
        "ResumeSans",
        normal="ResumeSans",
        bold="ResumeSans-Bold",
        italic="ResumeSans",
        boldItalic="ResumeSans-Bold",
    )


def build_styles():
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


def section(title: str, styles, width: float):
    table = Table([[Paragraph(title, styles["section"])]], colWidths=[width])
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


def job_header(company: str, period: str, role: str, styles, width: float):
    table = Table(
        [[Paragraph(company, styles["job"]), Paragraph(period, styles["date"])]],
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
    return [table, Paragraph(f"职位：{role}", styles["role"])]


def bullet(text: str, styles):
    return Paragraph(f"• {text}", styles["bullet"])


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("ResumeSans", 7)
    canvas.setFillColor(colors.HexColor("#8a8a8a"))
    canvas.drawString(doc.leftMargin, 13 * mm, "公开版简历 - 项目名称与内部细节已脱敏")
    canvas.drawRightString(A4[0] - doc.rightMargin, 13 * mm, f"{doc.page}")
    canvas.restoreState()


def build_resume() -> None:
    register_fonts()
    styles = build_styles()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=17 * mm,
        rightMargin=17 * mm,
        topMargin=13 * mm,
        bottomMargin=19 * mm,
        title="陈成 - 前端负责人 - 公开版简历",
        author="陈成",
        subject="前端负责人 / Full Stack Engineer",
    )
    width = A4[0] - doc.leftMargin - doc.rightMargin
    story = []

    story.extend(
        [
            Paragraph("陈成", styles["name"]),
            Paragraph(
                "前端负责人 / Full Stack Engineer &nbsp;&nbsp;|&nbsp;&nbsp; 期望职位：前端 / Full Stack",
                styles["headline"],
            ),
            section("个人信息", styles, width),
            Spacer(1, 3),
            bullet("本科 / 湖北师范大学 / 计算机科学与技术", styles),
            Spacer(1, 3),
            section("个人简介", styles, width),
            Spacer(1, 3),
            Paragraph(
                "10+ 年前端与全栈开发经验，长期负责复杂后台系统、业务 SDK、跨端应用与内部平台建设。现任前端负责人，负责 6 人前端团队，承担需求拆解、任务分配、方案设计、Code Review、疑难问题处理与跨团队技术支持。",
                styles["body"],
            ),
            Paragraph(
                "熟悉 React 技术栈、复杂后台架构与工程化治理，也具备后端、跨端、部署维护等完整项目经验。",
                styles["body"],
            ),
            Spacer(1, 3),
            section("核心能力", styles, width),
            Spacer(1, 3),
            bullet("复杂 B 端后台、业务 SDK 与跨端应用的架构设计、开发和长期治理。", styles),
            bullet("React 技术栈、组件抽象、微前端落地、工程质量与交付体系建设。", styles),
            bullet("团队管理、方案评审、任务推进、Code Review 与跨团队技术支持。", styles),
            bullet("具备 Node.js、Python、Go、PHP、数据库、容器和部署维护经验。", styles),
            Spacer(1, 3),
            section("技术栈", styles, width),
            Spacer(1, 3),
            bullet("前端：React / Redux / Vue / JavaScript / TypeScript / Webpack / Rollup / Next.js", styles),
            bullet("全栈与跨端：Node.js / Python / PHP / Go / Electron / React Native / Flutter / Tauri", styles),
            bullet("工程与基础设施：MySQL / PostgreSQL / Redis / MongoDB / Kafka / Git / Docker / Linux / Nginx", styles),
            Spacer(1, 4),
            section("工作经历", styles, width),
            Spacer(1, 4),
        ]
    )

    story.extend(job_header("美餐网", "2019.11 - 至今", "前端负责人", styles, width))
    story.append(
        Paragraph(
            "负责企业级运营后台、跨端交易能力、业务 SDK 与内部平台的架构和开发，同时负责前端团队管理、项目推进与跨团队技术支持。",
            styles["body"],
        )
    )
    story.extend(
        [
            Paragraph("大型运营后台与架构治理", styles["subhead"]),
            bullet("长期负责复杂运营后台的开发、维护与架构演进，持续推进存量系统迁移和公共能力治理。", styles),
            bullet("设计并落地微前端架构，统一导航、访问控制与运行时协作边界，使业务应用能够独立开发、发布和回滚。", styles),
            bullet("构建支持叠层页面与状态恢复的交互模型，解决复杂页面迁移、跨版本兼容和长链路操作问题。", styles),
            bullet("持续处理兼容性、构建发布、线上稳定性、路由与交互等疑难问题。", styles),
            Paragraph("SDK 与平台化能力", styles["subhead"]),
            bullet("设计并维护多个内部 SDK，将支付、数据分析、资源管理和财务等复杂页面封装为稳定接入接口。", styles),
            bullet("推动跨 Web 与小程序的统一接入协议，标准化流程状态、错误处理和平台适配。", styles),
            bullet("发起运营后台设计系统原型，推动设计变量、组件资产和工程规范在多个业务系统中复用。", styles),
            Paragraph("团队与工程推进", styles["subhead"]),
            bullet("负责 6 人前端团队的需求拆解、任务分配、方案把控和 Code Review，并支持跨团队协作。", styles),
            bullet("推进分支规范、质量检查、自动化构建与发布流程，降低多人协作和长期维护成本。", styles),
            bullet("探索 LLM 在复杂工作流梳理、测试路径生成与知识组织中的辅助应用，并完成内部原型验证。", styles),
        ]
    )

    story.append(PageBreak())

    story.extend(job_header("百度", "2017.11 - 2019.11", "高级研发工程师", styles, width))
    story.extend(
        [
            bullet("负责地图数据采集与核验工具开发，使外部协作者能够在 Web 地图上完成属性核验与任务回传。", styles),
            bullet("参与空间数据采集与统计平台建设，覆盖信息整合、轨迹渲染、指标统计和图形化展示。", styles),
            bullet("负责内容编辑器的开发与迭代，并参与编辑器内部开源方案的设计和推进。", styles),
            bullet("使用 React Native 开发跨平台应用原型，负责整体程序设计与主要逻辑实现。", styles),
            Spacer(1, 5),
        ]
    )

    story.extend(job_header("北京度家科技有限公司", "2017.03 - 2017.11", "桌面 App / 前端 / 后端主程", styles, width))
    story.extend(
        [
            Paragraph(
                "公司主要产品为原型设计工具，通过 PC 端完成原型与交互设计，并在移动端进行高保真预览。",
                styles["body"],
            ),
            bullet("负责跨平台桌面编辑器开发，实现主要编辑能力、事件系统和移动端预览。", styles),
            bullet("参与 PC 编辑器、移动客户端与后端交互的设计和开发。", styles),
            bullet("负责官网首页、作品分享和付费功能等模块开发。", styles),
            Spacer(1, 5),
        ]
    )

    story.extend(job_header("三亚汪汪信息科技有限公司", "2015.08 - 2017.03", "研发负责人", styles, width))
    story.extend(
        [
            Paragraph("面向本地达人服务、游客服务购买与景区产品购买的一体化平台。", styles["body"]),
            bullet("基于 React、Webpack 开发 H5 用户端，负责接口设计、页面开发与后续迭代。", styles),
            bullet("基于 Yii2 / MySQL / Redis 搭建后端系统。", styles),
            bullet("负责产品、订单、导游、广告、购物车、用户、权限和报表导出等模块。", styles),
            bullet("负责服务器搭建、部署和日常维护。", styles),
            Spacer(1, 5),
        ]
    )

    story.extend(job_header("爱旅行（北京爱旅伟邦科技有限公司）", "2012.09 - 2015.08", "高级工程师", styles, width))
    story.extend(
        [
            Paragraph("面向国内限时特价旅游产品的在线平台。", styles["body"]),
            bullet("独立开发海外供应商管理后台，支持订单、库存、统计与数据分析。", styles),
            bullet("参与航班数据库建设，整理航班、机型、航空公司和机场等基础数据。", styles),
            bullet("参与站内目的地、数据分析与供应商系统等项目开发。", styles),
            Spacer(1, 5),
            section("自我评价", styles, width),
            Spacer(1, 3),
            bullet("对代码质量和可维护性有较高要求，偏好清晰、直接、易理解的实现。", styles),
            bullet("乐于研究新技术和解决复杂问题，能够在历史系统中持续推进重构、治理与交付。", styles),
            bullet("重视团队协作、知识分享与工程规范，能够在业务目标和技术质量之间做取舍。", styles),
            Spacer(1, 5),
            Paragraph("GitHub: https://github.com/azlarsin &nbsp;&nbsp;|&nbsp;&nbsp; Email: azlarsin@gmail.com", styles["note"]),
        ]
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    build_resume()
