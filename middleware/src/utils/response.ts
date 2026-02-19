/**
 * Response helpers for consistent API responses
 * Raw payloads — no envelopes for success responses.
 */

import type { Response } from 'express';
import type { PaginationMeta } from '../types/api.js';

/** Send a single item (raw payload) */
export function sendItem<T>(res: Response, data: T, status = 200): void {
  res.status(status).json(data);
}

/** Send a paginated list */
export function sendList<T>(res: Response, items: T[], pagination: PaginationMeta): void {
  res.json({ items, pagination });
}

/** Send 204 No Content */
export function send204(res: Response): void {
  res.status(204).send();
}

/** Send 501 Not Implemented */
export function send501(res: Response, operation: string): void {
  res.status(501).json({
    code: 'NOT_IMPLEMENTED',
    message: `${operation} is not yet available`,
  });
}
