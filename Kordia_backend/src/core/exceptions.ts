export class KordiaError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'KordiaError';
  }
}

export class YouTubeError extends KordiaError {
  constructor(message: string) { super(message, 503); this.name = 'YouTubeError'; }
}

export class CacheError extends KordiaError {
  constructor(message: string) { super(message, 500); this.name = 'CacheError'; }
}

export class StorageError extends KordiaError {
  constructor(message: string) { super(message, 500); this.name = 'StorageError'; }
}

export class NotFoundError extends KordiaError {
  constructor(message = 'Recurso no encontrado') { super(message, 404); this.name = 'NotFoundError'; }
}

export class AlreadyExistsError extends KordiaError {
  constructor(message = 'Recurso ya existe') { super(message, 409); this.name = 'AlreadyExistsError'; }
}
