"""Answer generation. Gemini when configured, otherwise a transparent extractive fallback."""
import logging
import re
from dataclasses import dataclass
from typing import Protocol

from app.core.config import settings

log = logging.getLogger(__name__)

NO_INFO_ANSWER = (
    "I couldn't find this in CampusHub's official records. Please check with the relevant college office, "
    "or ask an administrator to add the information."
)

SYSTEM_PROMPT = """You are CampusHub, the official information assistant for {college}.
Answer the student's question using ONLY the numbered context passages provided.
Rules:
- Never invent or guess college-specific facts such as fees, dates, timings, names, phone numbers or rules.
- If the context does not contain the answer, reply exactly: "{no_info}"
- Cite the passages you used with bracketed numbers like [1] or [2].
- Prefer passages marked as verified institutional documents or database records.
- Be concise and friendly; use short paragraphs or bullet points. Your answer may be read aloud, so avoid tables.
"""


@dataclass
class ContextPassage:
    number: int
    source: str
    text: str


class AnswerGenerator(Protocol):
    name: str

    def generate(self, question: str, passages: list[ContextPassage], history: list[tuple[str, str]]) -> str: ...


def _format_context(passages: list[ContextPassage]) -> str:
    return "\n\n".join(f"[{p.number}] Source: {p.source}\n{p.text}" for p in passages)


class GeminiGenerator:
    def __init__(self, api_key: str, model: str):
        from google import genai

        self.client = genai.Client(api_key=api_key)
        self.model = model
        self.name = f"gemini:{model}"

    def generate(self, question, passages, history):
        from google.genai import types

        convo = "\n".join(f"{role.title()}: {text}" for role, text in history[-6:])
        prompt = (
            f"Context passages:\n{_format_context(passages)}\n\n"
            + (f"Recent conversation:\n{convo}\n\n" if convo else "")
            + f"Student question: {question}"
        )
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT.format(college=settings.COLLEGE_NAME, no_info=NO_INFO_ANSWER),
                temperature=0.2,
                max_output_tokens=800,
            ),
        )
        return (response.text or "").strip() or NO_INFO_ANSWER


class ExtractiveGenerator:
    """Returns the most relevant retrieved sentences verbatim, so nothing is ever invented."""

    name = "extractive"
    _STOP = {"the", "and", "for", "are", "what", "who", "how", "can", "does", "with", "about", "there", "which",
             "when", "where", "is", "my", "our", "your", "any", "tell", "please", "give", "need", "know", "want"}

    @classmethod
    def _terms(cls, text: str) -> set[str]:
        words = re.findall(r"[a-z0-9]+", text.lower())
        if "hod" in words:
            words += ["head", "department"]
        return {w[:5] for w in words if len(w) > 2 and w not in cls._STOP}

    def generate(self, question, passages, history):
        q_terms = self._terms(question)
        scored: list[tuple[float, int, str]] = []
        for rank, p in enumerate(passages[:4]):
            # Query words already present in the source title only identify the record; the words that are
            # not (e.g. "HOD", "timings") point to the sentence that actually answers the question.
            specific = q_terms - self._terms(p.source)
            text = re.sub(r"(?<![.!?:])\n(?!\n)", " ", p.text)
            for sentence in re.split(r"(?<!\bRs\.)(?<!\bNo\.)(?<!\bDr\.)(?<=[.!?])\s+(?!\d)|\n+", text):
                sentence = re.sub(r"\s+\d+\.$", "", sentence.strip())
                if len(sentence) < 25:
                    continue
                words = self._terms(sentence)
                overlap = len(q_terms & words) + len(specific & words)
                if overlap:
                    scored.append((overlap - rank * 0.5, p.number, sentence))
        scored.sort(key=lambda t: -t[0])
        best = scored[0][0] if scored else 0
        if best < 2 and passages:
            top = passages[0]
            excerpt = top.text if len(top.text) <= 400 else top.text[:400].rsplit(" ", 1)[0] + "…"
            return f"Here is the most relevant entry I found in the official records:\n- {excerpt} [{top.number}]"
        floor = max(1.0, best * 0.5) if len(q_terms) < 3 else max(2.0, best * 0.5)
        picked, seen = [], set()
        for score, number, sentence in scored:
            if score < floor and picked:
                break
            key = sentence.lower()[:60]
            if key in seen:
                continue
            seen.add(key)
            picked.append(f"- {sentence} [{number}]")
            if len(picked) == 4:
                break
        if not picked:
            return NO_INFO_ANSWER
        return "Here is what I found in the official records:\n" + "\n".join(picked)


_generator: AnswerGenerator | None = None


def get_generator() -> AnswerGenerator:
    global _generator
    if _generator is None:
        if settings.GEMINI_API_KEY:
            try:
                _generator = GeminiGenerator(settings.GEMINI_API_KEY, settings.GEMINI_MODEL)
            except Exception as exc:
                log.warning("Gemini unavailable, using extractive answers: %s", exc)
                _generator = ExtractiveGenerator()
        else:
            _generator = ExtractiveGenerator()
    return _generator
