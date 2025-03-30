import logging
import traceback
from datetime import datetime

# Set up logger
logger = logging.getLogger(__name__)

class WorkoutException(Exception):
    """Base exception class for all workout service errors."""
    status_code = 500
    error_code = "workout_service_error"
    message = "An unexpected error occurred in the workout service."

    def __init__(self, message=None, error_code=None, status_code=None):
        if message:
            self.message = message
        if error_code:
            self.error_code = error_code
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)
        
        # Log the exception with appropriate level based on status code
        self._log_error()

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
            "status": self.status_code,
            "timestamp": datetime.utcnow().isoformat()
        }


# Database Errors
class DatabaseError(WorkoutException):
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


# Authentication Errors
class AuthenticationError(WorkoutException):
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


# Workout Related Errors
class WorkoutError(WorkoutException):
    """Base class for workout related errors."""
    status_code = 400
    error_code = "workout_error"
    message = "An error occurred while processing the workout."


class WorkoutNotFoundException(WorkoutError):
    """Raised when a workout is not found."""
    status_code = 404
    error_code = "workout_not_found"
    message = "The requested workout could not be found."


class WorkoutAlreadyExistsError(WorkoutError):
    """Raised when attempting to create a workout that already exists."""
    status_code = 409
    error_code = "workout_already_exists"
    message = "A workout with this name and date already exists for this user."


class InvalidWorkoutDataError(WorkoutError):
    """Raised when provided workout data is invalid."""
    error_code = "invalid_workout_data"
    message = "The provided workout data is invalid."


class MissingRequiredFieldError(InvalidWorkoutDataError):
    """Raised when a required field is missing."""
    error_code = "missing_required_field"
    message = "A required field is missing."

    def __init__(self, field=None):
        message = f"Required field missing: {field}" if field else self.message
        super().__init__(message=message)


# Exercise Related Errors
class ExerciseError(WorkoutException):
    """Base class for exercise related errors."""
    status_code = 400
    error_code = "exercise_error"
    message = "An error occurred while processing exercise data."


class ExerciseNotFoundException(ExerciseError):
    """Raised when an exercise is not found."""
    status_code = 404
    error_code = "exercise_not_found"
    message = "The requested exercise could not be found."


class InvalidExerciseDataError(ExerciseError):
    """Raised when provided exercise data is invalid."""
    error_code = "invalid_exercise_data"
    message = "The provided exercise data is invalid."


class DuplicateExerciseError(ExerciseError):
    """Raised when attempting to create an exercise that already exists."""
    status_code = 409
    error_code = "exercise_already_exists"
    message = "An exercise with this name already exists."


# User Related Errors
class UserError(WorkoutException):
    """Base class for user related errors in workout service."""
    status_code = 400
    error_code = "user_error"
    message = "An error occurred while processing user data."


class UserNotFoundError(UserError):
    """Raised when a user is not found."""
    status_code = 404
    error_code = "user_not_found"
    message = "The user could not be found."


class UnauthorizedAccessError(UserError):
    """Raised when a user attempts to access unauthorized data."""
    status_code = 403
    error_code = "unauthorized_access"
    message = "You don't have permission to access this resource."


# Heuristic Related Errors
class HeuristicError(WorkoutException):
    """Base class for heuristic related errors."""
    status_code = 400
    error_code = "heuristic_error"
    message = "An error occurred in the workout recommendation system."


class InvalidHeuristicParametersError(HeuristicError):
    """Raised when invalid parameters are provided to the heuristic algorithm."""
    error_code = "invalid_heuristic_parameters"
    message = "Invalid parameters for workout recommendation."


class NoRecommendationsAvailableError(HeuristicError):
    """Raised when no workout recommendations can be generated."""
    status_code = 404
    error_code = "no_recommendations"
    message = "No workout recommendations available with the given parameters."


# User Related Errors
class UserWorkoutError(WorkoutException):
    """Base class for user-workout related errors."""
    status_code = 400
    error_code = "user_workout_error"
    message = "An error occurred with the user's workout."


class UserWorkoutLimitExceededError(UserWorkoutError):
    """Raised when a user exceeds their workout limit."""
    error_code = "workout_limit_exceeded"
    message = "User has exceeded their workout limit."


class UserAccessDeniedError(UserWorkoutError):
    """Raised when a user tries to access a workout they don't own."""
    status_code = 403
    error_code = "access_denied"
    message = "User does not have permission to access this workout."