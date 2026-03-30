import json
import re
from config import settings
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from prompts.session_init import SESSION_INIT_PROMPT
from prompts.question_generator import FIRST_QUESTION_PROMPT, NEXT_QUESTION_PROMPT, NUDGE_PROMPT
from prompts.answer_evaluator import ANSWER_EVALUATOR_PROMPT
from prompts.report_generator import REPORT_GENERATOR_PROMPT

class LLMService:
    def _get_model(self, temperature: float = 0.7):
        return ChatGroq(
            api_key=settings.groq_api_key,
            model="llama-3.3-70b-versatile",
            temperature=temperature
        )

    def _parse_json_response(self, text: str) -> dict:
        """
        Robustly extract JSON from the LLM's response.
        Handles: raw JSON, ```json blocks, ```blocks, extra commentary around JSON.
        """
        raw = text.strip()

        # Strategy 1: Try direct JSON parse (raw JSON, no markdown)
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass

        # Strategy 2: Extract from ```json ... ``` or ``` ... ``` code blocks
        code_block_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", raw, re.DOTALL)
        if code_block_match:
            try:
                return json.loads(code_block_match.group(1).strip())
            except json.JSONDecodeError:
                pass

        # Strategy 3: Find the first { ... } or [ ... ] balanced block in the text
        for start_char, end_char in [('{', '}'), ('[', ']')]:
            start_idx = raw.find(start_char)
            if start_idx == -1:
                continue
            depth = 0
            in_string = False
            escape_next = False
            for i in range(start_idx, len(raw)):
                ch = raw[i]
                if escape_next:
                    escape_next = False
                    continue
                if ch == '\\' and in_string:
                    escape_next = True
                    continue
                if ch == '"' and not escape_next:
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if ch == start_char:
                    depth += 1
                elif ch == end_char:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(raw[start_idx:i + 1])
                        except json.JSONDecodeError:
                            break
            # If balanced search didn't work, try from start_idx to last occurrence of end_char
            end_idx = raw.rfind(end_char)
            if end_idx > start_idx:
                try:
                    return json.loads(raw[start_idx:end_idx + 1])
                except json.JSONDecodeError:
                    pass

        raise ValueError(f"Could not parse JSON from response: {raw[:200]}...")

    async def _invoke_model(self, model, prompt: str) -> str:
        messages = [HumanMessage(content=prompt)]
        response = await model.ainvoke(messages)
        return response.content

    async def initialize_session(self, parsed_resume: dict, role: str,
                                  interview_type: str, difficulty: str) -> dict:
        model = self._get_model(temperature=0.3)
        prompt = SESSION_INIT_PROMPT.format(
            parsed_resume=json.dumps(parsed_resume, indent=2),
            role=role,
            interview_type=interview_type,
            difficulty=difficulty
        )
        response_text = await self._invoke_model(model, prompt)
        return self._parse_json_response(response_text)

    async def generate_first_question(self, parsed_resume: dict,
                                       role: str, strategy: dict) -> str:
        model = self._get_model(temperature=0.8)
        prompt = FIRST_QUESTION_PROMPT.format(
            parsed_resume=json.dumps(parsed_resume, indent=2),
            role=role,
            strategy=json.dumps(strategy, indent=2)
        )
        response_text = await self._invoke_model(model, prompt)
        return response_text.strip()

    async def generate_next_question(self, parsed_resume: dict, role: str,
                                      strategy: dict, conversation_history: list,
                                      last_evaluation: dict, questions_asked: int,
                                      topics_covered: list, topics_remaining: list) -> str:
        model = self._get_model(temperature=0.8)

        history_text = "\n".join([
            f"Q{i+1}: {item['question']}\nA: {item['answer']}\nQuality: {item.get('quality', 'N/A')}"
            for i, item in enumerate(conversation_history)
        ])

        prompt = NEXT_QUESTION_PROMPT.format(
            parsed_resume=json.dumps(parsed_resume, indent=2),
            role=role,
            strategy=json.dumps(strategy, indent=2),
            conversation_history=history_text,
            last_answer_quality=last_evaluation.get("answer_quality", "acceptable"),
            last_answer_gap=last_evaluation.get("what_they_missed", ""),
            questions_asked=questions_asked,
            topics_covered=", ".join(topics_covered),
            topics_remaining=", ".join(topics_remaining)
        )
        response_text = await self._invoke_model(model, prompt)
        return response_text.strip()

    async def evaluate_answer(self, question: str, answer: str,
                               relevant_background: str, role: str, difficulty: str) -> dict:
        model = self._get_model(temperature=0.1)
        prompt = ANSWER_EVALUATOR_PROMPT.format(
            question=question,
            answer=answer,
            relevant_background=relevant_background,
            role=role,
            difficulty=difficulty
        )
        response_text = await self._invoke_model(model, prompt)
        return self._parse_json_response(response_text)

    async def generate_nudge(self, current_question: str, relevant_background: str) -> str:
        model = self._get_model(temperature=0.7)
        prompt = NUDGE_PROMPT.format(
            current_question=current_question,
            relevant_background=relevant_background
        )
        response_text = await self._invoke_model(model, prompt)
        return response_text.strip()

    async def generate_report(self, candidate_name: str, role: str, difficulty: str,
                               transcript: list, all_evaluations: list) -> dict:
        model = self._get_model(temperature=0.2)

        transcript_text = "\n".join([
            f"Q{i+1}: {item['question']}\nA: {item['answer']}"
            for i, item in enumerate(transcript)
        ])

        prompt = REPORT_GENERATOR_PROMPT.format(
            candidate_name=candidate_name,
            role=role,
            difficulty=difficulty,
            transcript=transcript_text,
            all_evaluations=json.dumps(all_evaluations, indent=2)
        )
        response_text = await self._invoke_model(model, prompt)
        return self._parse_json_response(response_text)

    async def generate_progress_analysis(self, candidate_name: str, role: str,
                                          session_count: int, sessions_summary: str,
                                          analytics_data: str, prompt_template: str) -> dict:
        """Generate AI-powered progress coaching analysis."""
        model = self._get_model(temperature=0.3)
        prompt = prompt_template.format(
            candidate_name=candidate_name,
            role=role,
            session_count=session_count,
            sessions_summary=sessions_summary,
            analytics_data=analytics_data,
        )
        response_text = await self._invoke_model(model, prompt)
        return self._parse_json_response(response_text)

llm_service = LLMService()
