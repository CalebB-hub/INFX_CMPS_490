from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from django.conf import settings
import re


class ComplexityValidator:
    """
    Enforce password complexity rules aligned with PASSWORD_POLICY.
    """

    def __init__(self, min_length=None, require_uppercase=None, require_number=None, require_special=None):
        policy = getattr(settings, "PASSWORD_POLICY", {})
        self.min_length = min_length or policy.get("MIN_LENGTH", 8)
        self.require_uppercase = require_uppercase if require_uppercase is not None else policy.get("REQUIRE_UPPERCASE", True)
        self.require_number = require_number if require_number is not None else policy.get("REQUIRE_NUMBER", True)
        self.require_special = require_special if require_special is not None else policy.get("REQUIRE_SPECIAL_CHAR", True)

    def validate(self, password, user=None):
        errors = []

        if self.min_length and len(password) < self.min_length:
            errors.append(_("Password must be at least %(min_length)d characters long.") % {"min_length": self.min_length})

        if self.require_uppercase and not re.search(r"[A-Z]", password):
            errors.append(_("Password must contain at least one uppercase letter."))

        if self.require_number and not re.search(r"\d", password):
            errors.append(_("Password must contain at least one number."))

        if self.require_special and not re.search(r"[^\w\s]", password):
            errors.append(_("Password must contain at least one special character."))

        if errors:
            raise ValidationError(errors)

    def get_help_text(self):
        parts = []
        if self.min_length:
            parts.append(_("at least %(min_length)d characters") % {"min_length": self.min_length})
        if self.require_uppercase:
            parts.append(_("one uppercase letter"))
        if self.require_number:
            parts.append(_("one number"))
        if self.require_special:
            parts.append(_("one special character"))
        return _("Your password must contain ") + ", ".join(parts) + "."

