import logging
import traceback
from datetime import datetime

# Set up logger
logger = logging.getLogger(__name__)

class UserServiceError(Exception):
    """Base exception class for all user service errors."""
    status_code = 500
    error_code = "user_service_error"
    message = "An unexpected error occurred in the user service."

    def __init__(self, message=None, error_code=None, status_code=None):
        if message:
            self.message = message
        if error_code:
            self.error_code = error_code
        if status_code:
            self.status_code = status_code
            
        # Log the error with appropriate level
        self._log_error()
        
        super().__init__(self.message)
        
    def _log_error(self):
        """Log the error with appropriate level based on status code"""
        error_details = f"{self.__class__.__name__}: [{self.error_code}] {self.message}"
        
        # Use different log levels based on status code
        if self.status_code >= 500:
            logger.error(error_details)
            # Add stack trace for server errors
            logger.debug(f"Stack trace: {traceback.format_exc()}")
        elif self.status_code >= 400:
            logger.warning(error_details)
        else:
            logger.info(error_details)

    def to_dict(self):
        """Convert exception to a dictionary for API responses."""
        return {
            "error": self.error_code,
            "message": self.message,
            "timestamp": datetime.utcnow().isoformat()
        }


# Authentication Errors
class AuthenticationError(UserServiceError):
    """Base class for authentication related errors."""
    status_code = 401
    error_code = "authentication_error"
    message = "Authentication failed."


class InvalidTokenError(AuthenticationError):
    """Raised when a provided token is invalid."""
    error_code = "invalid_token"
    message = "The provided authentication token is invalid."


class ExpiredTokenError(AuthenticationError):
    """Raised when a provided token has expired."""
    error_code = "expired_token"
    message = "The provided authentication token has expired."


class MissingTokenError(AuthenticationError):
    """Raised when a required token is missing."""
    error_code = "missing_token"
    message = "Authentication token is required but was not provided."


# Database Errors
class DatabaseError(UserServiceError):
    """Base class for database related errors."""
    status_code = 500
    error_code = "database_error"
    message = "A database error occurred."


class ConnectionError(DatabaseError):
    """Raised when unable to connect to the database."""
    error_code = "db_connection_error"
    message = "Unable to connect to the database."


class QueryError(DatabaseError):
    """Raised when a database query fails."""
    error_code = "query_error"
    message = "Database query execution failed."


# User Related Errors
class UserError(UserServiceError):
    """Base class for user related errors."""
    status_code = 400
    error_code = "user_error"
    message = "An error occurred while processing the user."


class UserNotFoundException(UserError):
    """Raised when a user is not found."""
    status_code = 404
    error_code = "user_not_found"
    message = "The requested user could not be found."


class UserAlreadyExistsError(UserError):
    """Raised when attempting to create a user that already exists."""
    status_code = 409
    error_code = "user_already_exists"
    message = "A user with this email or username already exists."


class InvalidUserDataError(UserError):
    """Raised when provided user data is invalid."""
    error_code = "invalid_user_data"
    message = "The provided user data is invalid."


class MissingRequiredFieldError(InvalidUserDataError):
    """Raised when a required field is missing."""
    error_code = "missing_required_field"
    message = "A required field is missing."

    def __init__(self, field=None):
        message = f"Required field missing: {field}" if field else self.message
        super().__init__(message=message)


# Stats Related Errors
class StatsError(UserServiceError):
    """Base class for user statistics related errors."""
    status_code = 400
    error_code = "stats_error"
    message = "An error occurred while processing user statistics."


class StatsNotFoundException(StatsError):
    """Raised when user statistics are not found."""
    status_code = 404
    error_code = "stats_not_found"
    message = "The requested user statistics could not be found."


class InvalidStatsDataError(StatsError):
    """Raised when provided stats data is invalid."""
    error_code = "invalid_stats_data"
    message = "The provided statistics data is invalid."


# Login Related Errors
class LoginError(UserServiceError):
    """Base class for login related errors."""
    status_code = 401
    error_code = "login_error"
    message = "Login failed."


class IncorrectCredentialsError(LoginError):
    """Raised when login credentials are incorrect."""
    error_code = "incorrect_credentials"
    message = "The provided username or password is incorrect."


class AccountLockedError(LoginError):
    """Raised when an account is locked due to too many failed login attempts."""
    error_code = "account_locked"
    message = "Your account has been temporarily locked due to too many failed login attempts."


# Goal Related Errors
class GoalError(UserServiceError):
    """Base class for goal related errors."""
    status_code = 400
    error_code = "goal_error"
    message = "An error occurred while processing fitness goals."


class InvalidGoalTypeError(GoalError):
    """Raised when an invalid goal type is provided."""
    error_code = "invalid_goal_type"
    message = "The provided goal type is invalid. Valid types are 'weight', 'cardio', and 'strength'."
    
    def __init__(self, goal_type=None):
        if goal_type:
            message = f"Invalid goal type: '{goal_type}'. Valid types are 'weight', 'cardio', and 'strength'."
            super().__init__(message=message)
        else:
            super().__init__()


class GoalNotFoundException(GoalError):
    """Raised when a requested goal is not found."""
    status_code = 404
    error_code = "goal_not_found"
    message = "The requested fitness goal could not be found."


class InvalidGoalDataError(GoalError):
    """Raised when provided goal data is invalid."""
    error_code = "invalid_goal_data"
    message = "The provided goal data is invalid."


class InvalidLeaderboardTypeError(UserServiceError):
    """Raised when an invalid leaderboard type is requested."""
    status_code = 400
    error_code = "invalid_leaderboard_type"
    message = "The provided leaderboard type is invalid. Valid types are 'steps', 'weight', 'deadlift', 'squat', and 'bench'."
    
    def __init__(self, leaderboard_type=None):
        if leaderboard_type:
            message = f"Invalid leaderboard type: '{leaderboard_type}'. Valid types are 'steps', 'weight', 'deadlift', 'squat', and 'bench'."
            super().__init__(message=message)
        else:
            super().__init__()