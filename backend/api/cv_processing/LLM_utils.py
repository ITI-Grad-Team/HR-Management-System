import json
import re
import time
import PyPDF2
from io import BytesIO
import together
from django.conf import settings
from typing import List, Dict, Any

class TogetherCVProcessor:
    def __init__(self):
    #     together.api_key = settings.TOGETHER_API_KEY  # i hash this and it still works hmmmmm... maybe done internally

        self.model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
        self.max_retries = 1

    def extract_text(self, cv_file) -> str:
        """Extract text from PDF with error handling"""
        try:
            with BytesIO(cv_file.read()) as pdf_buffer:
                reader = PyPDF2.PdfReader(pdf_buffer)
                text = "\n".join(filter(None, [page.extract_text() for page in reader.pages]))
                word_count = len(text.split())

                if word_count > 1700:
                    raise ValueError(f"CV too long: {word_count} words (limit is 1700)")

            return text
        except Exception as e:
            raise ValueError(f"PDF read failed: {str(e)}")

    def build_prompt(self, text: str, choices: Dict[str, List[str]], position: Any) -> str:
        """Construct bulletproof prompt with JSON examples"""
        return f'''<s>[INST] Return ONLY valid JSON with these EXACT fields:
        {{
            "region": "Cairo", /* MUST be one of: {", ".join(choices['regions'])} */
            "degree": "Bachelor", /* (highest found) MUST be one of: {", ".join(choices['degrees'])} */
            "field":  "Mechanical Engineering", /* (field of study of the degree (Bachelor of what - Doctorate of what)) MUST be one of: {", ".join(choices['fields'])} */
            "experience": 2, /* integer years (If not found explicitly, just put 0) */
            "had_leadership": true, /* boolean */
            "skills": ["Python","Odoo"], /* Array ONLY from: {", ".join(choices['skills'])}... */
            "has_position_related_high_education": false /* boolean (is the field of study of the degree related to the position being applied to?) */
        }}

        Position being applied to: {position.name}

        CV:
        {text[:1700]}
        
        Rules:
        1. Use ONLY the specified fields
        2. Values MUST match the allowed options
        3. Return ONLY the JSON object with NO commentary AT ALL!!  [/INST]</s>
        
        Important:
        - The value of "field" must reflect the applicant's actual **degree field of study**, not their job or skills. DO NOT INFER'''

    def call_together_ai(self, prompt: str) -> Dict:
        print("📝 Prompt to Together AI:\n", prompt)

        """Robust API call with JSON validation"""
        for attempt in range(self.max_retries):
            try:
                response = together.Complete.create(
                    prompt=prompt,
                    model=self.model,
                    max_tokens=1500,
                    temperature=0.05,
                    stop=["</s>", "```json", "```"],
                    request_timeout=30
                )
                raw_text = response['choices'][0]['text'].strip()
                print("🔍 Raw Together AI output:", repr(raw_text))  # Debug log
                return self._parse_json_response(raw_text)
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise ValueError(f"API failed after {self.max_retries} attempts: {str(e)}")
                time.sleep(1)

    def _parse_json_response(self, raw_text: str) -> Dict:
        """Extract JSON from any messy response with cleanup and recovery"""
        try:
            # Strip code block wrappers
            if '```json' in raw_text:
                raw_text = raw_text.split('```json')[1].split('```')[0]
            elif '```' in raw_text:
                raw_text = raw_text.split('```')[1].split('```')[0]

            json_start = raw_text.find('{')
            json_end = raw_text.rfind('}') + 1

            if json_start == -1:
                raise ValueError("No JSON block found.")

            # Extract raw JSON string
            json_str = raw_text[json_start:json_end] if json_end > 0 else raw_text[json_start:]

            # If it's missing closing }, try to patch it
            if json_end == 0 or not json_str.strip().endswith("}"):
                last_comma = json_str.rfind(',')
                if last_comma != -1:
                    json_str = json_str[:last_comma] + "\n}"

            # Try parsing
            try:
                return json.loads(json_str)
            except json.JSONDecodeError:
                repaired = (
                    json_str
                    .replace("\\", "\\\\")
                    .replace("'", '"')
                    .replace("True", "true")
                    .replace("False", "false")
                )
                return json.loads(repaired)

        except Exception as e:
            raise ValueError(f"Failed to parse JSON: {str(e)}")



    def extract_info(self, cv_file, choices: Dict[str, List[str]], position: Any) -> Dict:
        """Main processing pipeline: safe, tolerant, and silent on missing/invalid fields."""
        try:
            text = self.extract_text(cv_file)
            prompt = self.build_prompt(text, choices, position)
            result = self.call_together_ai(prompt)

            print("✅ Parsed JSON from Together AI:", result)

            info = {}

            # Region
            region = result.get("region")
            if isinstance(region, str):
                try:
                    info["region"] = self._validate_choice(region, choices["regions"])
                except ValueError:
                    pass  # Skip invalid

            # Degree
            degree = result.get("degree")
            if isinstance(degree, str):
                try:
                    info["degree"] = self._validate_choice(degree, choices["degrees"])
                except ValueError:
                    pass

            # Experience
            experience = result.get("experience")
            if isinstance(experience, int):
                info["experience"] = experience
            else:
                try:
                    info["experience"] = int(experience)
                except (ValueError, TypeError):
                    pass

            # Leadership
            had_leadership = result.get("had_leadership")
            if isinstance(had_leadership, bool):
                info["had_leadership"] = had_leadership
            elif isinstance(had_leadership, str) and had_leadership.lower() in ["true", "false"]:
                info["had_leadership"] = had_leadership.lower() == "true"

            # Skills
            skills_raw = result.get("skills", [])
            if isinstance(skills_raw, list):
                allowed_skills_lower = [s.lower() for s in choices["skills"]]
                valid_skills = [
                    choices["skills"][allowed_skills_lower.index(skill.lower())]
                    for skill in skills_raw
                    if isinstance(skill, str) and skill.lower() in allowed_skills_lower
                ]
                if valid_skills:
                    info["skills"] = valid_skills

            # Field
            field = result.get("field")
            if isinstance(field, str):
                try:
                    info["field"] = self._validate_choice(field, choices["fields"])
                except ValueError:
                    pass

            # High Education
            high_ed = result.get("has_position_related_high_education")
            if isinstance(high_ed, bool):
                info["has_position_related_high_education"] = high_ed
            elif isinstance(high_ed, str) and high_ed.lower() in ["true", "false"]:
                info["has_position_related_high_education"] = high_ed.lower() == "true"

            return info

        except Exception as e:
            raise ValueError(f"CV processing failed: {str(e)}")



    def _validate_choice(self, value: str, options: List[str]) -> str:
        """Case-insensitive validation against known choices"""
        lower_options = [opt.lower() for opt in options]
        if value.lower() not in lower_options:
            raise ValueError(f"'{value}' not in allowed options")
        return options[lower_options.index(value.lower())]