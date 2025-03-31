import { NextResponse } from 'next/server';

// Error types
export enum ErrorType {
  DATABASE = 'database',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
}

// Error response structure
interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  code?: string;
  status: number;
}

// Error handler function
export function handleApiError(
  error: any,
  type: ErrorType = ErrorType.SERVER,
  customMessage?: string
): NextResponse<ErrorResponse> {
  console.error(`API Error (${type}):`, error);
  
  // Default error message
  let message = customMessage || 'An unexpected error occurred';
  let status = 500;
  let code = 'server_error';
  
  // Handle different error types
  switch (type) {
    case ErrorType.DATABASE:
      message = customMessage || 'Database operation failed';
      status = 503;
      code = 'database_error';
      
      // Handle specific MongoDB errors
      if (error.name === 'MongoNetworkError' || error.message?.includes('ECONNREFUSED')) {
        message = 'Database connection failed. Please try again later.';
        code = 'db_connection_error';
      } else if (error.name === 'MongoServerSelectionError') {
        message = 'Unable to reach database server. Please try again later.';
        code = 'db_server_selection_error';
      } else if (error.name === 'MongooseError' && error.message?.includes('buffering timed out')) {
        message = 'Database operation timed out. Please try again.';
        code = 'db_timeout_error';
      }
      break;
      
    case ErrorType.VALIDATION:
      message = customMessage || 'Invalid input data';
      status = 400;
      code = 'validation_error';
      break;
      
    case ErrorType.AUTHENTICATION:
      message = customMessage || 'Authentication required';
      status = 401;
      code = 'authentication_error';
      break;
      
    case ErrorType.AUTHORIZATION:
      message = customMessage || 'You do not have permission to perform this action';
      status = 403;
      code = 'authorization_error';
      break;
      
    case ErrorType.NOT_FOUND:
      message = customMessage || 'Resource not found';
      status = 404;
      code = 'not_found_error';
      break;
      
    default:
      // Server error (default)
      status = 500;
      code = 'server_error';
  }
  
  // Create error response
  const errorResponse: ErrorResponse = {
    error: code,
    message,
    status,
  };
  
  // Add error details in development environment
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      name: error.name,
      stack: error.stack,
      originalMessage: error.message,
    };
  }
  
  return NextResponse.json(errorResponse, { status });
}

// Helper function for database errors
export function handleDbError(error: any, customMessage?: string) {
  return handleApiError(error, ErrorType.DATABASE, customMessage);
}

// Helper function for validation errors
export function handleValidationError(error: any, customMessage?: string) {
  return handleApiError(error, ErrorType.VALIDATION, customMessage);
}

// Helper function for authentication errors
export function handleAuthError(error: any, customMessage?: string) {
  return handleApiError(error, ErrorType.AUTHENTICATION, customMessage);
}

// Helper function for authorization errors
export function handlePermissionError(error: any, customMessage?: string) {
  return handleApiError(error, ErrorType.AUTHORIZATION, customMessage);
}

// Helper function for not found errors
export function handleNotFoundError(error: any, customMessage?: string) {
  return handleApiError(error, ErrorType.NOT_FOUND, customMessage);
}
