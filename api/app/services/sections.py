import re

# Patterns mirror the TypeScript sections.ts detector so both engines
# produce consistent section keys (experience, skills, education, etc.).
SECTION_PATTERNS: list[tuple[str, re.Pattern]] = [
    ("summary",        re.compile(r"^(summary|profile|objective|about|professional summary|career objective)\s*:?$", re.I | re.M)),
    ("experience",     re.compile(r"^(experience|work experience|employment|professional experience|work history|career history)\s*:?$", re.I | re.M)),
    ("education",      re.compile(r"^(education|academic background|academic history|degrees?|schooling|qualifications)\s*:?$", re.I | re.M)),
    ("skills",         re.compile(r"^(skills|technical skills|core competencies|technologies|expertise|proficiencies)\s*:?$", re.I | re.M)),
    ("projects",       re.compile(r"^(projects|project experience|portfolio|personal projects|side projects|open.?source)\s*:?$", re.I | re.M)),
    ("certifications", re.compile(r"^(certifications?|licenses?|credentials|accreditations?|professional development)\s*:?$", re.I | re.M)),
    ("awards",         re.compile(r"^(awards?|honors?|achievements?|recognition)\s*:?$", re.I | re.M)),
    ("publications",   re.compile(r"^(publications?|research|papers?|articles?)\s*:?$", re.I | re.M)),
]


def detect_sections(text: str) -> dict[str, str]:
    lines = text.splitlines()
    buffers: dict[str, list[str]] = {"other": []}
    current = "other"

    for line in lines:
        trimmed = line.strip()
        matched_key = None
        for key, pattern in SECTION_PATTERNS:
            if pattern.match(trimmed):
                matched_key = key
                break

        if matched_key:
            current = matched_key
            buffers.setdefault(current, [])
        else:
            buffers.setdefault(current, [])
            buffers[current].append(line)

    return {k: "\n".join(v).strip() for k, v in buffers.items() if "\n".join(v).strip()}
