"""Domain errors.

Services raise these instead of HTTPException so business logic stays
framework-agnostic; a single handler in main.py maps them to JSON responses:
    {"error": {"code": "out_of_hearts", "message": "..."}}
"""


class DomainError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str, code: str | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class NotFoundError(DomainError):
    status_code = 404
    code = "not_found"


class ForbiddenError(DomainError):
    status_code = 403
    code = "forbidden"


class ConflictError(DomainError):
    status_code = 409
    code = "conflict"
