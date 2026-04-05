from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from your_app.models import Lesson, Module
import json

User = get_user_model()


LESSONS = [
    {
        "title": "Phishing Fundamentals: Recognize, Pause, Verify, Report",
        "lesson_material": "Phishing is a type of scam in which a criminal pretends to be a trusted person, company, school, bank, or government agency in order to trick someone into giving away information, clicking a malicious link, opening a harmful attachment, or sending money. The attacker’s goal is usually to steal usernames, passwords, banking information, personal data, or direct payments. Phishing can happen through email, text messages, phone calls, social media messages, and fake websites. Modern phishing is effective because it is designed to look normal and create emotional pressure. Many phishing messages try to make the victim feel afraid, rushed, curious, or excited before they have time to think carefully. Official consumer and law-enforcement guidance consistently warns that phishing messages often rely on urgency, threats, fake account problems, or requests for sensitive information to get fast compliance.

A strong way to teach phishing is to explain that the message itself is the trap, not just the link or attachment. A phishing message may say your account has been suspended, a payment failed, suspicious activity was detected, a package could not be delivered, or you must act immediately to avoid losing access. These stories are meant to push the victim into reacting instead of checking. Many phishing messages also contain smaller warning signs: a greeting like “Dear Customer,” an address or domain that does not match the real organization, unusual spelling or formatting, unexpected attachments, or requests for passwords and financial details. Still, not every phishing message looks sloppy. Some are polished and convincing, which is why people should not depend only on guessing whether something “looks fake.” Safer behavior comes from following a routine every time something feels unexpected or high stakes. FTC, Microsoft, Google, and FBI guidance all point toward this same general habit: do not act directly from the suspicious message; verify independently instead.

The most useful beginner lesson is a simple response process: Pause, Inspect, Verify, Report, Delete. First, pause. Do not click, reply, open attachments, or call numbers listed in the message. Second, inspect. Ask: Was I expecting this? What exactly is being asked of me? Is there urgency, secrecy, or fear? Who is it really from? Third, verify. If the message claims to be from your bank, school, employer, or another service, go to that organization through a trusted method such as typing the website yourself, using a saved bookmark, opening the official app, or calling a known phone number from a bill or statement. Fourth, report. Many email systems and services allow phishing to be reported directly, and consumer guidance also recommends reporting phishing attempts to help stop scams. Fifth, delete the message once it has been reported or safely handled. This process matters because it shifts control away from the attacker and back to the user.

Students should also learn that phishing is not only about spotting clues, but about knowing how to react after a mistake. If someone clicks a phishing link, opens a suspicious file, or enters information into a fake page, the correct response is not panic but quick action. Recommended steps include running a security scan, changing affected passwords, enabling multi-factor authentication where possible, and contacting banks, employers, or IT support if financial or work accounts may be involved. Reporting the incident can also help reduce damage. This part of the lesson is important because people often think one mistake means the situation is hopeless, but fast action can greatly reduce harm. Learning how phishing works, why it works, and how to respond gives students a repeatable defense they can use in everyday life.",
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
        "lesson_material": "A large number of phishing attacks succeed because they guide people to fake websites that look real. The attacker sends a message that appears to come from a trusted source and includes a link that leads to a counterfeit login page, payment page, or form. That fake page may closely copy the design, colors, and wording of the real organization. A victim may believe they are signing into a bank, school portal, cloud service, or shopping site, when in reality they are typing their password or card number directly into a site controlled by the attacker. FBI guidance specifically warns that phishing often sends victims to spoofed websites that may look nearly identical to legitimate ones. That is why link safety is one of the most important parts of phishing education.

Students need to understand that the visible words in a link are not always the same as the actual destination. An attacker can make a button say something trustworthy like “Review Account” or “Sign In Securely” while the real link goes somewhere else entirely. They can also register lookalike domains that resemble the real site with small changes in spelling, extra words, or character substitutions. A fake domain might include the company name somewhere in the address, but still belong to the attacker. For example, people often focus on a familiar brand name inside a long URL and miss the true domain. Microsoft and FBI guidance both emphasize carefully examining the destination and watching for subtle misspellings and misleading structures.

A strong habit to teach is link inspection before interaction. On a computer, hovering over a link can reveal where it really goes. On a mobile device, long-pressing may preview the destination. But even when the destination looks reasonable, a safer rule is often to avoid logging in from message links at all when the message is unexpected. Google explicitly advises users not to enter their password after clicking a link in a message and instead go directly to the site they want to use. This is a powerful teaching point because it reduces the need to perfectly judge every suspicious link. If a message says there is a problem with an account, the safer action is to open a new tab, type the site yourself, use a saved bookmark, or open the official app and check there. By using this habit, users protect themselves even when a phishing message looks convincing.

This lesson should also cover modern variants such as QR-code phishing. A QR code is simply another kind of link, but it hides the destination until scanned, which makes it easier for an attacker to bypass a user’s normal visual inspection. Recent APWG reporting tracked QR-code phishing as part of broader phishing trends, showing that attackers adapt delivery methods as users become more cautious. The lesson for students is that a QR code should be treated with the same suspicion as any unexpected link. Scanning should not be followed by automatic trust. If the QR code leads to a login request, payment screen, or urgent warning, the user should stop and verify through a trusted path instead of continuing from the code.

The deeper idea behind this lesson is that safe browsing is behavioral, not just visual. Users do not need to become experts in internet infrastructure to protect themselves. They need to remember a few practical rules: do not trust unexpected login links, inspect destinations before clicking, use official apps and bookmarks, and verify suspicious requests through known channels. These habits turn many phishing attempts into harmless messages because the attacker loses the ability to guide the victim step by step. When students learn that a trusted path is safer than a message-provided path, they gain a durable defense against fake websites.",
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
        "lesson_material": "Phishing is often taught as a problem of bad links, but attachments are just as important. Many phishing messages try to get a victim to open a file that appears harmless: an invoice, shipping notice, tax form, résumé, purchase order, scanned document, or shared file. The goal may be to install malware, steal login credentials, or trick the user into taking another risky action. Attackers rely on curiosity and urgency here too. A message might say “Action Required Today,” “Invoice Attached,” or “Review This Secure Document Immediately.” Because the file arrives with a believable story, users may open it before asking whether they were expecting it in the first place. FTC, NIST, Microsoft, and FBI guidance all warn that suspicious attachments and downloads are a common risk in phishing and related scams.

A good teaching approach is to show students that file type alone does not make something safe. Some people assume a PDF, document, or compressed file is safe if it looks ordinary, but context matters more than appearance. An attachment becomes suspicious when it is unexpected, paired with urgency, linked to an unfamiliar sender, or tied to a request for money or personal information. Students should learn to ask: Was I expecting this file? Does this sender normally contact me this way? Is there pressure to act quickly? Is there an instruction to enable content, bypass warnings, or log into something? If the answer raises doubt, the correct action is not to open the file. Instead, verify the request through another channel. If it seems to come from a delivery service, log into the real delivery account or use the official app. If it seems to come from work or school, check through the actual portal or contact the sender using a known method.

This lesson should also explain that reporting and deletion are part of safe attachment handling. Users sometimes think they need to reply to suspicious messages or click unsubscribe to make them stop, but NIST guidance specifically warns not to engage with phishing emails and not to click links in them, including unsubscribe links. That is an important correction because many people think unsubscribing is always safe. With a phishing message, any interaction may confirm the address is active or lead to another trap. A safer workflow is to stop, verify independently if needed, report through the platform or organization, and delete the message. Teaching this removes the false idea that every email should be “handled” through the email itself.

A major part of this lesson should focus on recovery. Many people want phishing training to help them avoid mistakes, but it is just as important to teach what to do after one. If someone clicks a suspicious link or opens a file that may have downloaded harmful software, official guidance recommends immediate protective steps. These can include updating security software, running a device scan, changing affected passwords, and contacting financial institutions or organizational support if important accounts are involved. Multi-factor authentication should also be enabled when available because it adds protection if a password has been stolen. Students should understand that quick response can limit damage. The lesson becomes stronger when it teaches both prevention and recovery, because it prepares people for real-world situations rather than pretending perfect caution is always possible.

This topic is especially valuable because attachment-based scams often succeed on routine, not just fear. People receive documents all the time for work, school, business, and personal tasks. That normality makes file-based phishing effective. The best defense is a personal rule: unexpected attachments do not get opened until verified. If opened by mistake, the user acts quickly, protects accounts, and reports the problem. Once students understand that prevention and response are both learnable skills, they are more likely to act carefully without feeling helpless.",
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
        "lesson_material": "Not all phishing is sent in bulk. Some of the most damaging attacks are targeted at a specific person, role, or organization. These attacks may impersonate a boss, vendor, bank representative, payroll staff member, coworker, or family contact and ask for something high stakes: a wire transfer, gift cards, updated bank information, payroll changes, sensitive records, or urgent account access. The more tailored the request, the more believable it can seem. FBI guidance on business email compromise describes these scams as among the most financially damaging because they exploit trust and ordinary business communication. In these attacks, the criminal does not always need technical complexity; they often just need the victim to believe that a request is legitimate and urgent.

A powerful way to teach this lesson is to explain the difference between ordinary phishing and targeted phishing. Ordinary phishing may go to thousands of people and use generic language. Targeted phishing, sometimes called spearphishing in broader usage, is more personal. It may mention real coworkers, travel plans, vendor relationships, recent projects, or actual deadlines. It may also be timed carefully. Attackers can study social media, public websites, breached data, and past conversations to make a request look realistic. That means students should not assume a message is safe just because it knows their name, role, or workplace details. In fact, extra personalization can be part of the deception. FBI material on spoofing and BEC emphasizes that trusted names and familiar-looking addresses can be faked or imitated closely enough to fool people who act quickly.

This lesson should also expand beyond email. Smishing refers to phishing by text message, and vishing refers to phishing by voice or phone call. These channels can feel more immediate and personal than email, which makes them powerful tools for social engineering. A text might claim a package problem, suspicious banking activity, a toll fee, or an urgent account warning. A phone call may pretend to come from fraud prevention, technical support, or a manager asking for fast action. FBI guidance explicitly identifies smishing and vishing as phishing variations, which makes it important for students to understand that phishing is a behavior pattern, not an email-only problem. The warning signs remain similar: urgency, sensitive requests, unfamiliar pressure, and discouraging verification.

The core defense for high-stakes phishing is two-channel verification. If a request comes by email, verify it by calling a known number or using an established workflow. If it comes by text, verify through the official app or website. If it comes by phone, hang up and call the published number yourself. The key idea is that the second channel must be independently obtained, not provided by the suspicious message. This matters because attackers often try to control the entire conversation. A common red flag is a request that says “handle this quietly,” “don’t call,” or “do this immediately.” Blocking verification is itself a warning sign. Teaching students to require independent confirmation for money movement, account changes, password resets, or sensitive data release creates a strong barrier against social pressure. FTC, FBI, and Google guidance all support the principle of avoiding message-provided verification paths and going directly to trusted sources.

This lesson can also introduce the idea of phishing-resistant authentication at a high level. Passwords can be stolen through fake sites, and even some multi-factor methods can still be manipulated through phishing workflows. NIST guidance states that systems at certain assurance levels must offer phishing-resistant authentication options, and FIDO guidance describes passkeys as phishing resistant by design. For students, the important takeaway is not the technical standard itself, but the principle: reducing reliance on secrets that can be typed into fake pages makes account theft harder. Still, even stronger authentication does not replace cautious behavior. Users must still verify unusual requests, avoid suspicious links, and question urgency. Strong authentication is an added layer, not permission to trust messages blindly.

This final lesson is broader because it teaches judgment under pressure. High-stakes phishing is dangerous precisely because it mixes trust, emotion, and timing. Students should leave with a firm rule: when money, credentials, payroll, gift cards, personal records, or account control are involved, verification comes before action. That principle works across email, text, phone, and other platforms. It protects both individuals and organizations by turning urgent social pressure into a routine safety check.",
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

    def add_arguments(self, parser):
        parser.add_argument("--user_email", type=str, required=True)
        parser.add_argument("--module_id", type=int, required=False)

    def handle(self, *args, **options):
        user_email = options["user_email"]
        module_id = options.get("module_id")

        try:
            user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            raise CommandError(f"User with email '{user_email}' does not exist.")

        module = None
        if module_id is not None:
            try:
                module = Module.objects.get(pk=module_id)
            except Module.DoesNotExist:
                raise CommandError(f"Module with id '{module_id}' does not exist.")

        for item in LESSONS:
            lesson, created = Lesson.objects.update_or_create(
                title=item["title"],
                user_id=user,
                defaults={
                    "module": module,
                    "lesson_material": item["lesson_material"],
                    "questions": json.dumps(item["questions"], indent=2),
                    "score": None,
                    "completed_at": None,
                },
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created: {lesson.title}"))
            else:
                self.stdout.write(self.style.WARNING(f"Updated: {lesson.title}"))

        self.stdout.write(self.style.SUCCESS("Finished seeding phishing lessons."))
