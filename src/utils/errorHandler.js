import {
  ConflictError,
  CredentialsError,
  NotFoundError,
  ValidationError,
} from './Error.js';

export function handleError(error, res) {
  console.log(error);

  if (error instanceof ConflictError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof NotFoundError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  if (error instanceof CredentialsError) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  res
    .status(500)
    .json({ message: 'Internal server error', error: error.message });
}
