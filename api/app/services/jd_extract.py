import re
from dataclasses import dataclass


@dataclass
class JdExtract:
    requirements_text: str
    nice_to_have_text: str
    full_text: str  # noise-stripped; used when section detection finds nothing


# Section header patterns — each compiled with re.I | re.M
_REQUIREMENTS_RE = re.compile(
    r"^(requirements?|qualifications?|must[- ]?have|required skills?|"
    r"what you[''`]?ll? (need|bring)|you (have|bring|must have)|"
    r"minimum qualifications?|basic qualifications?|"
    r"responsibilities and requirements?|skills (required|needed)|"
    r"key requirements?)\s*:?$",
    re.I | re.M,
)

_NICE_RE = re.compile(
    r"^(preferred|nice[- ]to[- ]have|bonus|a plus|bonuses|"
    r"preferred qualifications?|additional qualifications?|"
    r"would be (great|a plus|a bonus|nice)|"
    r"it[''`]?s a (plus|bonus)|pluses?|ideally)\s*:?$",
    re.I | re.M,
)

_NOISE_RE = re.compile(
    r"^(about (us|the company|our company|the team|the role)|"
    r"who we are|our (story|mission|values?|culture|vision)|"
    r"benefits?|perks?|compensation|salary range?|total rewards?|pay range?|"
    r"equal opportunity|eeo statement?|diversity (&|and) inclusion|"
    r"how to apply|application (process|instructions?)|"
    r"(why|join) us|why (join|work for|work at)|what we offer|"
    r"about this role)\s*:?$",
    re.I | re.M,
)

# Inline markers within a non-nice section that flag a line as nice-to-have
_INLINE_NICE_RE = re.compile(
    r"\b(preferred|nice[- ]to[- ]have|bonus|a plus|ideally|advantageous|"
    r"it[''`]?s? a (plus|bonus))\b",
    re.I,
)


def extract_jd(jd_text: str) -> JdExtract:
    """Split a job description into requirements, nice-to-have, and noise-stripped text.

    Algorithm:
      - Walk lines; when a header line matches a category pattern, switch state.
      - Accumulate non-header lines into the appropriate bucket.
      - Noise sections are fully suppressed.
      - Lines in a requirements section that contain inline nice-to-have markers
        are moved to the nice-to-have bucket.
      - If no requirements section is ever found, the entire noise-stripped text
        is used as requirements (handles compact JDs without explicit headers).
    """
    lines = jd_text.splitlines()
    current: str = "other"  # "required" | "nice" | "noise" | "other"

    req_lines: list[str] = []
    nice_lines: list[str] = []
    full_lines: list[str] = []

    for line in lines:
        trimmed = line.strip()

        if _REQUIREMENTS_RE.match(trimmed):
            current = "required"
            continue
        if _NICE_RE.match(trimmed):
            current = "nice"
            continue
        if _NOISE_RE.match(trimmed):
            current = "noise"
            continue

        if current == "noise":
            continue

        full_lines.append(line)

        if current == "required":
            if _INLINE_NICE_RE.search(trimmed):
                nice_lines.append(line)
            else:
                req_lines.append(line)
        elif current == "nice":
            nice_lines.append(line)
        else:
            # "other" — treat as requirements (short/compact JDs)
            req_lines.append(line)

    req_text = "\n".join(req_lines).strip()
    nice_text = "\n".join(nice_lines).strip()
    full_text = "\n".join(full_lines).strip()

    return JdExtract(
        requirements_text=req_text if req_text else full_text,
        nice_to_have_text=nice_text,
        full_text=full_text if full_text else jd_text.strip(),
    )
