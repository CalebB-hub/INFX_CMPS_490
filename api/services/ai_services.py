import json
import google.generativeai as genai
import pydantic
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

def _generate_emails(subject):
    api_key = "AIzaSyD5qsOBDPVP7xzpMq_GO2aQbxQSJepu1iU"
    #api_key = getattr(settings, 'GEMINI_API_KEY', None)

    if not api_key:
        return Response(
            {'error': 'GEMINI_API_KEY is not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    genai.configure(api_key=api_key)
    model=genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""
    A user is about to take a test on how to spot phishing emails scams. We need the create 15 fake emails to use for this test with the following criteria:

    For both normal and phishing emails include:
    1) The sender's email address
    2) A subject line
    3) An email body
    4) After the email include a field "IsPhishing", set to either "True" or "False"
    5) A list of red flags in the email. If the email is a normal email (IsPhishing = False), this field will be empty.

    The test may be focused in on one type of phishing scam. If the bellow field, "Subject", is empty, feel free to include any type of phishing scam email.
    Subject: {subject}

    When generating the emails, you should follow the following format, making sure to include the separation lines:

    =================================================
    Sender's Email: <sender's email address>
    Subject: <subject line>

    Body: <body>

    IsPhishing: <True or False>
    Red Flags: <red flags>
    =================================================

    You will generate 9 normal emails and 6 phishing emails following this format.
    """

    response = model.generate_content(prompt)
    raw_text = response.text

    print(raw_text)

_generate_emails("suspicious sender email address")