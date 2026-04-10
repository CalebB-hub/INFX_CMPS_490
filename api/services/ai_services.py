import json
import os
import google.genai as genai
import pydantic
from dotenv import load_dotenv
from rest_framework.response import Response
from rest_framework import status

load_dotenv()

def _generate_emails(subject):
    try:
        from django.conf import settings
        api_key = getattr(settings, 'GEMINI_API_KEY', None)
    except Exception:
        api_key = None
    api_key = api_key or os.environ.get('GEMINI_API_KEY')

    if not api_key:
        return Response(
            {'error': 'GEMINI_API_KEY is not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    client = genai.Client(api_key=api_key)

    prompt = f"""
    A user is about to take a test on how to spot phishing emails scams. We need the create 15 fake emails to use for this test with the following criteria:

    For both normal and phishing emails include:
    1) The sender's email address
    2) A subject line
    3) An email body
    4) After the email indicate whether the email is phishing or not with "True" or "False"
    5) A list of red flags in the email. If the email is a normal email (Is Phishing = False), this field will be empty.

    The test may be focused in on one type of phishing scam.
    Subject: {subject}

    When inserting fake links, leav no indicator that it is fake or not. For example, do NOT do this:
    "click the link below to confirm your identity and review recent activity: [link to fake utility login]."

    Instead, just generate a fake link that matches the email, for example:
    "click the link below to confirm your identity and review recent activity: https://utilitycompany.com/account."

    Return your response as a JSON array with no additional text or markdown. Each email should be an object with the following fields:
    "sender", "subject", "body", "is_phishing" (boolean), "red_flags" (array of strings).

    You will generate 9 normal emails and 6 phishing emails.
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            response_mime_type="application/json"
        )
    )
    return response.text

"""
Clean the repsonse from the AI and put it into a json
"""
def _clean_response(response):
    return json.loads(response)

if __name__ == "__main__":
    result = _clean_response(_generate_emails("Urgency"))
    with open("test_output.json", "w") as f:
        json.dump(result, f, indent=2)
    print("Saved to test_output.json")