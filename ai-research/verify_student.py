import json
import os
import sys
import time
from typing import Optional, Dict, Any

# Try import google.generativeai, handle if missing
try:
    import google.generativeai as genai
except ImportError:
    genai = None

from dotenv import load_dotenv
load_dotenv()

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DB_PATHS = {
    "nid": os.path.join(BASE_DIR, 'backend', 'data', 'nid_data.json'),
    "birth_certificate": os.path.join(BASE_DIR, 'backend', 'data', 'birth_certificate_data.json'),
    "student": os.path.join(os.path.dirname(__file__), 'student_database.json') # Keep for backward compatibility
}

def load_database(id_type):
    path = DB_PATHS.get(id_type)
    if not path or not os.path.exists(path):
        print(f"Error: Database file for '{id_type}' not found at {path}.")
        return []
    with open(path, 'r') as f:
        return json.load(f)

def extract_id_info(image_path: str, id_type: str) -> Optional[Dict[str, Any]]:
    """
    Uses Gemini to extract information from the ID card image.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not genai:
        print("Error: 'google-generativeai' library is missing.")
        return None
        
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.", file=sys.stderr)
        return None

    if not os.path.exists(image_path):
        print(f"Error: Image file '{image_path}' not found.")
        return None

    print(f"Contacting Gemini API for {id_type} extraction...")
    genai.configure(api_key=api_key)
    
    try:
        model = genai.GenerativeModel('gemini-flash-latest') # Using latest flash alias for best compatibility
        
        import PIL.Image
        img = PIL.Image.open(image_path)

        prompt = f"""
        Analyze the provided {id_type} image and extract ONLY the following fields exactly as shown:
        - id_number (The unique identification number)
        - name (Full name of the person)
        - date_of_birth (Format: YYYY-MM-DD, try to normalize if different)

        Rules:
        - Extract text ONLY if it is clearly visible.
        - Normalize output: Names in UPPERCASE, Remove extra spaces.
        - Return ONLY raw JSON string, no markdown formatting.
        - If a field is missing, use null.
        
        Format:
        {{
          "id_number": "...",
          "name": "...",
          "date_of_birth": "..."
        }}
        """

        response = model.generate_content([prompt, img])
        
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
             text = text.split("```")[1].split("```")[0]
        
        return json.loads(text.strip())

    except Exception as e:
        print(f"Error extracting data: {e}")
        return None

def validate_id(extracted_data: Dict[str, Any], database: list, provided_id_number: str) -> Dict[str, Any]:
    if not extracted_data:
        return {"is_valid": False, "reason": "Extraction failed"}

    # Use extracted ID number if provided_id_number is not given, but usually we want to match both
    extracted_id = str(extracted_data.get("id_number", "")).strip()
    
    if not extracted_id:
         return {"is_valid": False, "reason": "ID number not found on image"}

    print(f"Validating ID Number: {provided_id_number} (Extracted: {extracted_id})")

    # 1. Match provided ID number with extracted ID number (strict check)
    if provided_id_number and provided_id_number != extracted_id:
        return {"is_valid": False, "reason": f"ID number mismatch: Provided='{provided_id_number}' vs Extracted='{extracted_id}'"}

    # 2. Find record in database
    record = next((item for item in database if str(item.get("id_number")) == extracted_id), None)

    if not record:
        return {"is_valid": False, "reason": f"ID Number {extracted_id} not found in database"}

    # 3. Validate name and DOB
    mismatches = []
    
    # Check Name
    db_name = str(record.get("name", "")).upper().strip()
    card_name = str(extracted_data.get("name", "")).upper().strip()
    
    if db_name != card_name:
         mismatches.append(f"Name mismatch: DB='{db_name}' vs Image='{card_name}'")

    # Check DOB
    db_dob = str(record.get("date_of_birth", "")).strip()
    card_dob = str(extracted_data.get("date_of_birth", "")).strip()
    
    if db_dob != card_dob:
         mismatches.append(f"Date of Birth mismatch: DB='{db_dob}' vs Image='{card_dob}'")

    if not mismatches:
        return {"is_valid": True, "reason": "Verification Successful. Identity Confirmed.", "data": record}
    else:
        return {"is_valid": False, "reason": "; ".join(mismatches)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_student.py <image_path> [id_type] [id_number] [--json-output]")
        sys.exit(1)

    image_path = sys.argv[1]
    id_type = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("--") else "nid"
    provided_id_number = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else None
    json_output = "--json-output" in sys.argv

    if json_output:
        original_stdout = sys.stdout
        sys.stdout = sys.stderr

    # 1. Load DB
    db = load_database(id_type)
    if not db:
        if json_output:
            sys.stdout = original_stdout
            print(json.dumps({"is_valid": False, "reason": f"Database for {id_type} not found"}))
        sys.exit(1)
    
    # 2. Extract Data
    extracted_data = extract_id_info(image_path, id_type)
    
    if extracted_data:
        # 3. Validate
        result = validate_id(extracted_data, db, provided_id_number)
        
        if json_output:
            sys.stdout = original_stdout
            result['extracted_data'] = extracted_data
            print(json.dumps(result))
        else:
            print("-" * 30)
            print("EXTRACTED DATA:", json.dumps(extracted_data, indent=2))
            print("-" * 30)
            print("VERIFICATION RESULT:", json.dumps(result, indent=2))
        
        sys.exit(0 if result["is_valid"] else 2)
    else:
        if json_output:
            sys.stdout = original_stdout
            print(json.dumps({"is_valid": False, "reason": "Failed to extract text from image"}))
        sys.exit(1)

