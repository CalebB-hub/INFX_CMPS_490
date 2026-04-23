from django.core.management.base import BaseCommand
from api.models import Lesson
import json


LESSONS = [
    {
        "title": "Phishing Fundamentals: Recognize, Pause, Verify, Report",
        "lesson_material": """
Phishing is a scam where someone pretends to be a trusted person, business, school, bank, or organization to trick someone into giving away private information, clicking harmful links, opening unsafe attachments, or sending money. The goal is usually to steal personal data, account access, or money by making the victim believe the message is real.

## Main Idea
Phishing works by creating pressure and making the target act too quickly to think carefully. Instead of relying on whether a message “looks real,” the safer habit is to stop and verify before taking any action.

## Common Red Flags
- Urgent language
- Threats about account closure or suspension
- Requests for passwords or private information
- Suspicious sender address
- Unexpected links or attachments
- Generic greetings like "Dear Customer"

These warning signs do not always appear all at once, but even one or two of them can be enough to justify caution. The more high-pressure or unusual the request is, the more carefully it should be checked.

## Urgent Language
Phishing messages often try to rush the victim with phrases like "act now," "immediate action required," or "your account will be locked." This is meant to stop careful thinking. Urgency is powerful because people are more likely to react emotionally when they think they might lose access to an account or miss something important.

## Suspicious Sender
A phishing message may look like it comes from a real organization, but the actual sender email may not match the real company or institution. Attackers often use names that look familiar while hiding a different or misleading email address underneath.

## Requests for Sensitive Information
Legitimate organizations usually do not ask for passwords, banking details, or other sensitive personal information through random email or text messages. A message that asks for this kind of information directly should be treated as suspicious until it is independently verified.

## Safe Response
A good response is to pause, inspect the message, verify the request through a trusted source, report it if needed, and delete it. This process helps prevent mistakes because it removes the attacker’s control over how the victim responds.""",

        "questions": [
            {
                "question": "Which choice best describes phishing?",
                "choices": [
                    "A hardware failure in a router",
                    "An attempt to steal information or access accounts using deceptive messages that look legitimate",
                    "A legal method of marketing by email",
                    "A software update process"
                ],
                "answer": "An attempt to steal information or access accounts using deceptive messages that look legitimate"
            },
            {
                "question": "A message says, 'Your account is on hold due to a billing problem—click to update payment details.' What is the best first response?",
                "choices": [
                    "Click quickly to avoid losing access",
                    "Reply asking if it’s real",
                    "Contact the company using a phone number or website you know is real",
                    "Forward it to friends for advice"
                ],
                "answer": "Contact the company using a phone number or website you know is real"
            }
        ]
    },
    {
        "title": "Link, URL, and Website Verification: Don’t Get Led to a Fake Login",
        "lesson_material": """Many phishing attacks try to lead people to fake websites that look real. These sites are designed to steal usernames, passwords, payment details, or other personal information. Some fake sites are very convincing and may closely copy the appearance of real login pages.

## Main Idea
The link shown in a message may not go where it claims, so users should verify where links really lead before clicking. A message may look normal on the surface, but the link can still lead to a harmful or deceptive site.

## Common Red Flags
- Links that do not match the real site
- Misspelled website names
- Strange subdomains
- Extra words in the URL
- IP address links
- Login requests from unexpected messages

The safest habit is to assume that an unexpected login link should not be trusted automatically. Instead of judging only by appearance, users should focus on the destination and whether the request was expected.

## Suspicious Link
A link may look safe in the message text, but the real destination may be different. Attackers use this to send victims to fake login pages. This is why checking the actual URL matters more than trusting the words displayed in the message.

## Fake Websites
A fake website may copy the colors, logos, and layout of a real site. Even if it looks professional, it may still be a phishing page. Attackers know that many people judge websites by appearance alone, so the visual design is often made to build false trust.

## Safe Link Habits
Instead of clicking a link in an unexpected message, open the official site yourself by typing the address, using a bookmark, or using the official app. This is one of the strongest defenses because it avoids the attacker’s link entirely.

## QR Codes
QR codes can also hide dangerous links. They should be treated with the same caution as suspicious URLs. Just because a code is convenient or easy to scan does not mean the destination is safe.
""",
        "questions": [
            {
                "question": "Why do many phishing messages include a link?",
                "choices": [
                    "To improve your internet speed",
                    "To send you to a spoofed website that looks legitimate and steals information",
                    "To provide customer support",
                    "To download official security updates"
                ],
                "answer": "To send you to a spoofed website that looks legitimate and steals information"
            },
            {
                "question": "On a computer, what is a recommended way to check where a link goes before clicking?",
                "choices": [
                    "Click it quickly and close the window",
                    "Hover over the link to preview the destination URL",
                    "Reply to the email and ask",
                    "Assume it’s safe if it has a logo"
                ],
                "answer": "Hover over the link to preview the destination URL"
            }
        ]
    },
    {
        "title": "Attachments, Downloads, and What If I Clicked?",
        "lesson_material": """Phishing is not only about links. Some phishing attacks use files and downloads to install malware, steal information, or trick users into more risky actions. Attachments can be disguised as invoices, forms, delivery notices, or important work documents.

## Main Idea
Unexpected attachments should not be opened unless they are verified first. A file can seem harmless while still being part of an attack, especially if it appears in a message that creates urgency or confusion.

## Common Red Flags
- Unexpected invoices
- Fake shipping notices
- Urgent document requests
- Zipped files from unknown senders
- Attachments that ask you to enable content
- File requests that seem out of place

These signs matter because attackers often rely on curiosity and routine. If a file appears out of nowhere or feels inconsistent with normal communication, it should be checked before being opened.

## Dangerous Attachments
A file may look normal, such as a PDF, form, or invoice, but still be part of a phishing or malware attack. The risk does not come only from strange file names; it also comes from the context in which the file was sent.

## Verification Before Opening
If a file was not expected, the user should verify it through a trusted source before opening it. This could mean contacting the sender in another way, checking the official portal, or asking whether the document was actually meant to be sent.

## If You Clicked
If a suspicious file was opened or a harmful link was clicked, the user should act quickly by scanning the device, changing passwords, and contacting the right support or financial institution if needed. Quick action can reduce damage, especially if the mistake involved financial accounts or important login credentials.

## Reporting and Deleting
Suspicious emails should usually be reported and deleted instead of replied to or interacted with. Reporting helps the organization or provider detect threats faster and may help protect other users from the same scam.

""",
        "questions": [
            {
                "question": "Why are unexpected attachments risky?",
                "choices": [
                    "They always slow down Wi-Fi",
                    "They may install malware or lead to credential theft",
                    "They guarantee your account is safe",
                    "They only affect printers"
                ],
                "answer": "They may install malware or lead to credential theft"
            },
            {
                "question": "Best default action for an unexpected attachment is:",
                "choices": [
                    "Open immediately to see what it is",
                    "Verify out-of-band first; open only if confirmed legitimate",
                    "Forward it to everyone",
                    "Reply with your password to confirm identity"
                ],
                "answer": "Verify out-of-band first; open only if confirmed legitimate"
            }
        ]
    },
    {
        "title": "Targeted Phishing, Smishing, Vishing, and High-Stakes Requests",
        "lesson_material": """Some phishing attacks are highly targeted and are designed to look like they come from a boss, vendor, bank, or trusted contact. These may happen through email, text messages, or phone calls. Targeted scams are especially dangerous because they often use details that make the message seem personally relevant.

## Main Idea
High-stakes requests should always be verified through a second trusted method before any action is taken. The more serious the request is, such as money transfers or account changes, the more important independent verification becomes.

## Common Red Flags
- Requests for money or gift cards
- Payroll or bank change requests
- Text messages asking for account action
- Phone calls claiming fraud or urgent support
- Messages that demand secrecy
- Pressure not to verify

These warning signs are especially important when the request involves money, access, or sensitive records. Attackers often combine urgency with authority to make the target feel unable to say no or slow down.

## Targeted Phishing
Targeted phishing uses personal details, familiar names, or work-related information to make a scam look more believable. Because it appears more customized, it can be harder to notice than generic phishing attempts.

## Smishing
Smishing is phishing done through text messages. It often involves fake delivery alerts, account problems, or urgent login requests. Texts can feel more immediate than emails, which is why they are often used to pressure people into fast action.

## Vishing
Vishing is phishing done through phone calls or voice messages. Attackers may pretend to be support staff, bank workers, or authority figures. A phone call can feel convincing because the scammer can respond in real time and create pressure during the conversation.

## High-Stakes Requests
Requests involving money, account access, sensitive records, or urgent changes should never be trusted just because they look official. Even if the message appears to come from someone known, it should still be confirmed through an independent method.

## Safe Verification
If a message asks for something important, verify it through a second trusted path, such as calling a real number or logging in through the official website or app. This breaks the attacker’s control over the situation and gives the user a chance to confirm what is real.

## Overall Takeaway
Phishing defense is based on careful habits:
- Slow down
- Inspect the message
- Verify independently
- Avoid trusting urgency
- Report suspicious activity
- Protect accounts quickly if a mistake happens

The most effective protection is not perfect guessing, but consistent safe behavior. When users build habits around checking and verifying, they become much harder for phishing attacks to manipulate.""",
        "questions": [
            {
                "question": "Business email compromise (BEC) is best described as:",
                "choices": [
                    "A printer malfunction",
                    "A scam using emails that appear to be from known sources to induce legitimate-sounding high-stakes actions",
                    "A harmless marketing tactic",
                    "A way to update software"
                ],
                "answer": "A scam using emails that appear to be from known sources to induce legitimate-sounding high-stakes actions"
            },
            {
                "question": "Smishing refers to:",
                "choices": [
                    "Voice phishing",
                    "SMS/text-message phishing",
                    "Password managers",
                    "A secure login protocol"
                ],
                "answer": "SMS/text-message phishing"
            }
        ]
    }
]


class Command(BaseCommand):
    help = "Seed phishing lessons into the Lesson table"

    def handle(self, *args, **options):
        for item in LESSONS:
            # Extract questions, choices, and answers from the LESSONS data
            questions = [entry["question"] for entry in item["questions"]]
            choices = [entry["choices"] for entry in item["questions"]]
            answers = [entry["answer"] for entry in item["questions"]]

            lesson, created = Lesson.objects.update_or_create(
                title=item["title"],
                defaults={
                    "lesson_material": item["lesson_material"],
                    "questions": json.dumps(questions, indent=2),
                    "choices": json.dumps(choices, indent=2),
                    "answers": json.dumps(answers, indent=2),
                },
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {lesson.title}"))
            else:
                self.stdout.write(self.style.WARNING(f"Updated: {lesson.title}"))

        self.stdout.write(self.style.SUCCESS("Finished seeding phishing lessons."))
