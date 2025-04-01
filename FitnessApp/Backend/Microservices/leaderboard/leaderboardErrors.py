import logging
import traceback
from datetime import datetime

# Set up logger
logger = logging.getLogger(__name__)

class LeaderboardServiceError(Exception):
    """Base exception class for all leaderboard service errors."""
    status_code = 500
    error_code = "leaderboard_service_error"
    message = "An unexpected error occurred in the leaderboard service."

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
class AuthenticationError(LeaderboardServiceError):
    """Base class for authentication related errors."""
    status_code = 401
    error_code = "authentication_error"
    message = "Authentication failed."


class InvalidKeyError(AuthenticationError):
    """Raised when a provided key is invalid."""
    error_code = "invalid_key"
    message = "The provided authentication key is invalid or not found."


class MissingKeyError(AuthenticationError):
    """Raised when a required key is missing."""
    error_code = "missing_key"
    message = "Authentication key is required but was not provided."


# Database Errors
class DatabaseError(LeaderboardServiceError):
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


# Parameter Errors
class ParameterError(LeaderboardServiceError):
    """Base class for parameter related errors."""
    status_code = 400
    error_code = "parameter_error"
    message = "Invalid parameter provided."


class InvalidCategoryError(ParameterError):
    """Raised when an invalid category is provided."""
    error_code = "invalid_category"
    message = "The provided category is not valid."


class MissingWorkoutError(ParameterError):
    """Raised when workout ID is required but missing."""
    error_code = "missing_workout"
    message = "Workout ID is required for this leaderboard category."


class InvalidDateRangeError(ParameterError):
    """Raised when provided date range is invalid."""
    error_code = "invalid_date_range"
    message = "The provided date range is invalid."


class InvalidNumberError(ParameterError):
    """Raised when the provided number parameter is invalid."""
    error_code = "invalid_number"
    message = "The provided number parameter must be a positive integer."


# Data Errors
class DataError(LeaderboardServiceError):
    """Base class for data related errors."""
    status_code = 404
    error_code = "data_error"
    message = "The requested data could not be found."


class NoLeaderboardDataError(DataError):
    """Raised when no leaderboard data exists for the given parameters."""
    error_code = "no_leaderboard_data"
    message = "No leaderboard data found for the specified parameters."


class ExerciseNotFoundError(DataError):
    """Raised when the specified exercise is not found."""
    error_code = "exercise_not_found"
    message = "The specified exercise could not be found."