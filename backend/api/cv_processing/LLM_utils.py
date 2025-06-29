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
        together.api_key = settings.TOGETHER_API_KEY
        self.model = "mistralai/Mixtral-8x7B-Instruct-v0.1"
        self.max_retries = 3

    def extract_text(self, cv_file) -> str:
        """Extract text from PDF with error handling"""
        try:
            with BytesIO(cv_file.read()) as pdf_buffer:
                reader = PyPDF2.PdfReader(pdf_buffer)
                return "\n".join(filter(None, [page.extract_text() for page in reader.pages]))
        except Exception as e:
            raise ValueError(f"PDF read failed: {str(e)}")

    def build_prompt(self, text: str, choices: Dict[str, List[str]], position: Any) -> str:
        """Construct bulletproof prompt with JSON examples"""
        return f'''<s>[INST] Return ONLY valid JSON with these EXACT fields:
        {{
            "region": "{choices['regions'][0]}", /* MUST be one of: {", ".join(choices['regions'])} */
            "degree": "{choices['degrees'][0]}", /* MUST be one of: {", ".join(choices['degrees'])} */
            "experience": /* integer years (found explicit or estimated) */
            "had_leadership": /* boolean */
            "skills": ["{choices['skills'][0]}"], /* Array ONLY from: {", ".join(choices['skills'][:5])}... */
            "field": "{choices['fields'][0]}" /* MUST be one of: {", ".join(choices['fields'])} */
            "has_position_related_high_education": /* boolean (is field related to position:  {position.name}) */

        }}
        
        {text[:6000]}
        
        Rules:
        1. Use ONLY the specified fields
        2. Values MUST match the allowed options
        3. Return ONLY the JSON object with no commentary [/INST]</s>'''

    def _clean_json_response(self, raw_text: str) -> Dict:
        """Extract JSON from potentially messy response"""
        try:
            # Handle code block format
            if '```json' in raw_text:
                raw_text = raw_text.split('```json')[1].split('```')[0]
            elif '```' in raw_text:
                raw_text = raw_text.split('```')[1].split('```')[0]
            
            # Find first { and last }
            start = raw_text.find('{')
            end = raw_text.rfind('}') + 1
            return json.loads(raw_text[start:end])
        except Exception as e:
            raise ValueError(f"Failed to parse JSON: {str(e)}")
        
    def _parse_json_response(self, raw_text: str) -> Dict:
        """Extract JSON from any messy response"""
        try:
            # Case 1: Clean JSON
            if raw_text.startswith('{'):
                return json.loads(raw_text)
                
            # Case 2: Markdown-wrapped JSON
            if '```json' in raw_text:
                json_str = raw_text.split('```json')[1].split('```')[0]
                return json.loads(json_str)
                
            # Case 3: Find first { and last }
            json_start = raw_text.find('{')
            json_end = raw_text.rfind('}') + 1
            if json_start != -1 and json_end != 0:
                return json.loads(raw_text[json_start:json_end])
                
            raise ValueError("No JSON found in response")
            
        except json.JSONDecodeError as e:
            # Try to fix common formatting issues
            repaired = raw_text.replace("'", '"').replace("True", "true").replace("False", "false")
            try:
                return json.loads(repaired)
            except:
                raise ValueError(f"Failed to parse JSON: {str(e)}")

    def call_together_ai(self, prompt: str) -> Dict:
        """Robust API call with JSON validation"""
        for attempt in range(3):  # Retry up to 3 times
            try:
                response = together.Complete.create(
                    prompt=prompt,
                    model=self.model,
                    max_tokens=800,
                    temperature=0.1,
                    stop=["</s>", "```json", "```"],
                    request_timeout=30  # Add timeout
                )
                
                raw_text = response['choices'][0]['text'].strip()
                return self._parse_json_response(raw_text)
            
            except Exception as e:
                if attempt == 2:  # Final attempt
                    raise ValueError(f"API failed after 3 attempts: {str(e)}")
                time.sleep(1)  # Brief delay before retry

    def extract_info(self, cv_file, choices: Dict[str, List[str]], position: Any) -> Dict:
        """Main processing pipeline with better skill validation"""
        try:
            text = self.extract_text(cv_file)
            prompt = self.build_prompt(text, choices, position)
            print(prompt)
            result = self.call_together_ai(prompt)
            
            # Case-insensitive skill matching
            allowed_skills_lower = [s.lower() for s in choices['skills']]
            valid_skills = [
                choices['skills'][allowed_skills_lower.index(skill.lower())]
                for skill in result["skills"]
                if skill.lower() in allowed_skills_lower
            ]
            
            if not valid_skills:
                raise ValueError(
                    f"No valid skills matched. "
                    f"Returned: {result['skills']} | "
                    f"Allowed: {choices['skills']}"
                )
            
            return {
                "region": self._validate_choice(result["region"], choices["regions"]),
                "degree": self._validate_choice(result["degree"], choices["degrees"]),
                "experience": int(result["experience"]),
                "had_leadership": bool(result["had_leadership"]),
                "skills": valid_skills,
                "has_position_related_high_education": bool(result["has_position_related_high_education"]),
                "field": self._validate_choice(result["field"], choices["fields"])
            }
            
        except Exception as e:
            raise ValueError(f"CV processing failed: {str(e)}")

    def _validate_choice(self, value: str, options: List[str]) -> str:
        """Case-insensitive validation"""
        lower_options = [opt.lower() for opt in options]
        if value.lower() not in lower_options:
            raise ValueError(f"'{value}' not in allowed options")
        return options[lower_options.index(value.lower())]