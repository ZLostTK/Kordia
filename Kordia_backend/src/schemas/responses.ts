import { Type } from '@sinclair/typebox';

export const StreamResponse = Type.Object({
  ytid: Type.String(),
  url: Type.String(),
  cached: Type.Boolean(),
});

export const DownloadResponse = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  path: Type.Optional(Type.String()),
});

export const OfflineListResponse = Type.Object({
  songs: Type.Array(Type.Any()),
});

export const CleanupResponse = Type.Object({
  success: Type.Boolean(),
  deleted: Type.Number(),
});

export const HealthResponse = Type.Object({
  app: Type.String(),
  version: Type.String(),
  status: Type.String(),
});

export const ErrorResponse = Type.Object({
  success: Type.Boolean(),
  error: Type.String(),
  detail: Type.Optional(Type.String()),
});
