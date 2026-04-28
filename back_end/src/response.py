from fastapi import status, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

class CustomException(HTTPException):
    """
    Custom Exception class for API errors. 
    Inherits from HTTPException to remain compatible with FastAPI's ecosystem 
    while allowing for a custom response structure.
    """
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=message)
        self.message = message
        self.status_code = status_code


def success_response(data=None, message=None, status_code=status.HTTP_200_OK):
    """Returns a standardized success JSON response."""
    return JSONResponse(
        content={
            "data": jsonable_encoder(data),
            "succeeded": True,
            "message": message,
            "httpStatusCode": status_code,
        },
        status_code=status.HTTP_200_OK,
    )

def login_response(data: dict, message: str = "Login successful"):
    """
    Special response for login to ensure Swagger UI compatibility.
    FastAPI/Swagger requires access_token at the root level.
    """
    return JSONResponse(
        content=jsonable_encoder({
            "access_token": data.get("access_token"),
            "token_type": data.get("token_type"),
            "succeeded": True,
            "message": message,
            "data": data,
            "httpStatusCode": 200,
        }),
        status_code=status.HTTP_200_OK,
    )

def raise_exception(message, status_code=status.HTTP_400_BAD_REQUEST):
    """Raises a CustomException which is caught by the global error handler."""
    raise CustomException(message=message, status_code=status_code)

def error_handler(request: Request, exc: Exception):
    """
    Global error handler that ensures all exceptions are returned 
    in a consistent JSON format.
    """
    if isinstance(exc, CustomException):
        status_code = exc.status_code
        message = exc.message
    elif isinstance(exc, HTTPException):
        status_code = exc.status_code
        message = exc.detail
    else:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        message = str(exc) if status.HTTP_500_INTERNAL_SERVER_ERROR == 500 else "Internal Server Error"
        # In production, you'd hide the raw exception message for 500s.
        message = "Internal Server Error"

    return JSONResponse(
        status_code=status_code,
        content={
            "data": [],
            "succeeded": False,
            "message": message,
            "httpStatusCode": status_code,
        },
    )
