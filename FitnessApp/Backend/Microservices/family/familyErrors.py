"""
Custom exceptions for the Family microservice.
This module defines a hierarchy of exceptions specific to the Family service operations.
"""

import logging

# Set up logger
logger = logging.getLogger("Family")

class FamilyServiceError(Exception):
    """Base exception class for all Family microservice errors"""
    status_code = 500
    error_code = "FAMILY_SERVICE_ERROR"
    
    def __init__(self, message="An error occurred in the Family microservice", status_code=None, error_code=None):
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if error_code is not None:
            self.error_code = error_code
        super().__init__(self.message)
        
    def to_dict(self):
        """Convert exception to a dictionary for JSON response"""
        return {
            "error": self.error_code,
            "message": self.message
        }

# Authentication Errors
class AuthenticationError(FamilyServiceError):
    """Base exception class for authentication errors"""
    status_code = 401
    error_code = "AUTHENTICATION_ERROR"
    
    def __init__(self, message="Authentication failed", error_code=None):
        # Always pass status_code and error_code to parent
        super().__init__(message, self.status_code, error_code or self.error_code)

class InvalidTokenError(AuthenticationError):
    """Exception raised when an invalid authentication token is provided"""
    error_code = "INVALID_TOKEN"
    
    def __init__(self, message="Invalid authentication token"):
        # Only pass message to parent, which will handle status_code and error_code
        super().__init__(message, self.error_code)

class ExpiredTokenError(AuthenticationError):
    """Exception raised when an expired authentication token is provided"""
    error_code = "EXPIRED_TOKEN"
    
    def __init__(self, message="Authentication token has expired"):
        super().__init__(message, self.error_code)

class MissingTokenError(AuthenticationError):
    """Exception raised when no authentication token is provided"""
    error_code = "MISSING_TOKEN"
    
    def __init__(self, message="No authentication token provided"):
        super().__init__(message, self.error_code)

# Database Errors
class DatabaseError(FamilyServiceError):
    """Base exception class for database errors"""
    status_code = 500
    error_code = "DATABASE_ERROR"
    
    def __init__(self, message="A database error occurred", status_code=None, error_code=None):
        # Call parent with all parameters
        super().__init__(message, status_code or self.status_code, error_code or self.error_code)

class ConnectionError(DatabaseError):
    """Exception raised when a database connection error occurs"""
    error_code = "CONNECTION_ERROR"
    
    def __init__(self, message="Failed to connect to database"):
        # Call parent with just the message - parent will handle status_code and error_code
        super().__init__(message)

class QueryError(DatabaseError):
    """Exception raised when a database query error occurs"""
    error_code = "QUERY_ERROR"
    
    def __init__(self, message="Error executing database query"):
        # Call parent with just the message - parent will handle status_code and error_code
        super().__init__(message)

# Input Validation Errors
class ValidationError(FamilyServiceError):
    """Base exception class for input validation errors"""
    status_code = 400
    error_code = "VALIDATION_ERROR"
    
    def __init__(self, message="Invalid input data", status_code=None, error_code=None):
        # Match the parent's __init__ signature
        super().__init__(message, status_code or self.status_code, error_code or self.error_code)

class MissingRequiredFieldError(ValidationError):
    """Exception raised when a required field is missing from the request"""
    error_code = "MISSING_REQUIRED_FIELD"
    
    def __init__(self, field_name):
        message = f"Missing required field: {field_name}"
        # Only pass message to parent
        super().__init__(message)

class InvalidFamilyDataError(ValidationError):
    """Exception raised when invalid family data is provided"""
    error_code = "INVALID_FAMILY_DATA"
    
    def __init__(self, message="Invalid family data"):
        super().__init__(message)

# Family-specific Errors
class FamilyError(FamilyServiceError):
    """Base exception class for family-specific errors"""
    status_code = 400
    error_code = "FAMILY_ERROR"
    
    def __init__(self, message="An error occurred with the family operation", status_code=None, error_code=None):
        super().__init__(message, status_code or self.status_code, error_code or self.error_code)

class FamilyNotFoundError(FamilyError):
    """Exception raised when a family is not found"""
    status_code = 404
    error_code = "FAMILY_NOT_FOUND"
    
    def __init__(self, message="Family not found"):
        super().__init__(message, self.status_code, self.error_code)

class FamilyAlreadyExistsError(FamilyError):
    """Exception raised when attempting to create a family that already exists"""
    status_code = 409
    error_code = "FAMILY_ALREADY_EXISTS"
    
    def __init__(self, message="A family with this name already exists"):
        super().__init__(message, self.status_code, self.error_code)

class NotFamilyAdminError(FamilyError):
    """Exception raised when a user attempts an admin-only operation but is not the family admin"""
    status_code = 403
    error_code = "NOT_FAMILY_ADMIN"
    
    def __init__(self, message="User is not the family admin"):
        super().__init__(message, self.status_code, self.error_code)

class UserNotInFamilyError(FamilyError):
    """Exception raised when attempting an operation with a user who is not in the family"""
    status_code = 404
    error_code = "USER_NOT_IN_FAMILY"
    
    def __init__(self, message="User is not in the family"):
        super().__init__(message, self.status_code, self.error_code)

class UserAlreadyInFamilyError(FamilyError):
    """Exception raised when attempting to add a user who is already in the family"""
    status_code = 409
    error_code = "USER_ALREADY_IN_FAMILY"
    
    def __init__(self, message="User is already in the family"):
        super().__init__(message, self.status_code, self.error_code)

class UserNotFoundError(FamilyError):
    """Exception raised when a user is not found"""
    status_code = 404
    error_code = "USER_NOT_FOUND"
    
    def __init__(self, message="User not found"):
        super().__init__(message, self.status_code, self.error_code)

class CannotRemoveAdminError(FamilyError):
    """Exception raised when attempting to remove the admin from a family"""
    status_code = 403
    error_code = "CANNOT_REMOVE_ADMIN"
    
    def __init__(self, message="Cannot remove the family admin"):
        super().__init__(message, self.status_code, self.error_code)

class CannotLeaveFamilyError(FamilyError):
    """Exception raised when a user cannot leave a family (e.g., last member, only admin)"""
    status_code = 403
    error_code = "CANNOT_LEAVE_FAMILY"
    
    def __init__(self, message="Cannot leave the family"):
        super().__init__(message, self.status_code, self.error_code)

# Request-specific Errors
class RequestError(FamilyServiceError):
    """Base exception class for family request errors"""
    status_code = 400
    error_code = "REQUEST_ERROR"
    
    def __init__(self, message="An error occurred with the family request operation", status_code=None, error_code=None):
        super().__init__(message, status_code or self.status_code, error_code or self.error_code)

class RequestNotFoundError(RequestError):
    """Exception raised when a family join request is not found"""
    status_code = 404
    error_code = "REQUEST_NOT_FOUND"
    
    def __init__(self, message="Family request not found"):
        super().__init__(message, self.status_code, self.error_code)

class RequestAlreadyExistsError(RequestError):
    """Exception raised when attempting to create a request that already exists"""
    status_code = 409
    error_code = "REQUEST_ALREADY_EXISTS"
    
    def __init__(self, message="A request for this user to join this family already exists"):
        super().__init__(message, self.status_code, self.error_code)

class NotRequestRecipientError(RequestError):
    """Exception raised when a user who is not the request recipient attempts to accept/reject it"""
    status_code = 403
    error_code = "NOT_REQUEST_RECIPIENT"
    
    def __init__(self, message="User is not the recipient of this request"):
        super().__init__(message, self.status_code, self.error_code)

class RequestAlreadyProcessedError(RequestError):
    """Exception raised when attempting to process a request that has already been processed"""
    status_code = 409
    error_code = "REQUEST_ALREADY_PROCESSED"
    
    def __init__(self, message="This request has already been processed"):
        super().__init__(message, self.status_code, self.error_code)