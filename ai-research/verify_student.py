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
DB_PATH = os.path.join(os.path.dirname(__file__), 'student_database.json')

def load_database():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database file '{DB_PATH}' not found.")
        return []
    with open(DB_PATH, 'r') as f:
        return json.load(f)

def extract_id_info(image_path: str) -> Optional[Dict[str, Any]]:
    """
    Uses Gemini 1.5 Flash to extract information from the ID card image.
    Requires GEMINI_API_KEY environment variable.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not genai:
        print("Error: 'google-generativeai' library is missing.")
        print("Please install it using: pip install google-generativeai")
        return None
        
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print("Please export GEMINI_API_KEY='your_api_key_here'")
        return None

    if not os.path.exists(image_path):
        print(f"Error: Image file '{image_path}' not found.")
        return None

    print("Contacting Gemini API for extraction...")
    genai.configure(api_key=api_key)
    
    try:
        # Use a model that supports vision (Gemini 2.5 Flash is fast and cheap)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Upload file (Gemini API requires upload for analysis in some contexts, or inline data)
        # Using inline data for simplicity if file is small, but new SDK prefers file API for 1.5
        # Let's try standard file upload patterns or PIL image if supported.
        # The python SDK supports passing MIME types directly.
        
        # Simplest way with current SDK:
        import PIL.Image
        img = PIL.Image.open(image_path)

        prompt = """
        Analyze the provided student ID card image and extract ONLY the following fields exactly as shown on the card:
        - university_name
        - student_id
        - student_name
        - program
        - department
        - country

        Rules:
        - Extract text ONLY if it is clearly visible on the card.
        - Normalize output: Names in UPPERCASE, Remove extra spaces, Keep original spelling.
        - Return ONLY raw JSON string, no markdown formatting.
        - If a field is missing, use null.
        
        Format:
        {
          "university_name": "...",
          "student_id": "...",
          "student_name": "...",
          "program": "...",
          "department": "...",
          "country": "..."
        }
        """

        response = model.generate_content([prompt, img])
        
        # Clean up JSON if model adds markdown blocks
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
             text = text.split("```")[1].split("```")[0]
        
        return json.loads(text.strip())

    except Exception as e:
        print(f"Error extracting data: {e}")
        return None

def validate_student(extracted_data: Dict[str, Any], database: list) -> Dict[str, Any]:
    if not extracted_data:
        return {"is_valid": False, "reason": "Extraction failed"}

    student_id = extracted_data.get("student_id")
    if not student_id:
        return {"is_valid": False, "reason": "Student ID not found on card"}

    print(f"Validating Student ID: {student_id}")

    # Find record
    record = next((item for item in database if item["student_id"] == str(student_id)), None)

    if not record:
        return {"is_valid": False, "reason": f"Student ID {student_id} not found in database"}

    # Validate strictly
    mismatches = []
    
    # Check Name
    db_name = record["student_name"].upper().strip()
    card_name = extracted_data["student_name"].upper().strip() if extracted_data["student_name"] else ""
    
    if db_name != card_name:
         mismatches.append(f"Name mismatch: DB='{db_name}' vs Card='{card_name}'")

    # Check Department
    db_dept = record.get("department", "").upper().strip()
    card_dept = extracted_data.get("department", "").upper().strip() if extracted_data.get("department") else ""
    if db_dept != card_dept:
         mismatches.append(f"Department mismatch: DB='{db_dept}' vs Card='{card_dept}'")

    if not mismatches:
        return {"is_valid": True, "reason": "Verification Successful. Identity Confirmed."}
    else:
        return {"is_valid": False, "reason": "; ".join(mismatches)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_student.py <path_to_id_card_image> [--json-output]")
        sys.exit(1)

    image_path = sys.argv[1]
    json_output = "--json-output" in sys.argv

    # Redirect print to stderr if json_output is on, to keep stdout clean for JSON
    if json_output:
        original_stdout = sys.stdout
        sys.stdout = sys.stderr

    # 1. Load DB
    db = load_database()
    if not db:
        sys.exit(1)
        
    print(f"Loaded {len(db)} records from database.")
    
    # 2. Extract Data
    extracted_data = extract_id_info(image_path)
    
    if extracted_data:
        print("-" * 30)
        print("EXTRACTED DATA:")
        print(json.dumps(extracted_data, indent=2))
        print("-" * 30)
        
        # 3. Validate
        result = validate_student(extracted_data, db)
        
        if json_output:
            # Restore stdout and print ONLY the result JSON
            sys.stdout = original_stdout
            # Combine extracted data into the result for the frontend to use
            result['extracted_data'] = extracted_data
            print(json.dumps(result))
        else:
            print("\nVERIFICATION RESULT:")
            print(json.dumps(result, indent=2))
        
        # Exit with status code for automation
        if result["is_valid"]:
            sys.exit(0)
        else:
            sys.exit(2) # 2 for verification failure
    else:
        print("Failed to process image.")
        if json_output:
            sys.stdout = original_stdout
            print(json.dumps({"is_valid": False, "reason": "Failed to process image"}))
        sys.exit(1)
