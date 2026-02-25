/**
 * AdminRepository — audited bypass wrapper for leadership aggregate queries.
 *
 * Provides cross-tenant access for admin/leadership views.
 * Every query is wrapped in a callback that auto-logs the action,
 * userId, and reason — logging cannot be skipped.
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import type { ScopedModel } from './tenant-repository.js';

export interface AdminRepository {
  /** Run a cross-tenant query with mandatory audit logging */
  query<T>(action: string, reason: string, fn: (prisma: PrismaClient) => Promise<T>): Promise<T>;

  /** Scoped model accessors (no tenant filter, but still logged) */
  hub: ScopedModel;
  hubVideo: ScopedModel;
  hubDocument: ScopedModel;
  hubProject: ScopedModel;
  hubMilestone: ScopedModel;
  hubEvent: ScopedModel;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
type PrismaDelegate = {
  findMany: CallableFunction;
  findFirst: CallableFunction;
  count: CallableFunction;
  create: CallableFunction;
  upsert: CallableFunction;
  update: CallableFunction;
  updateMany: CallableFunction;
  delete: CallableFunction;
  deleteMany: CallableFunction;
};

function loggedModel(
  delegate: PrismaDelegate,
  userId: string,
): ScopedModel {
  const log = (method: string): void => {
    logger.info({ userId, method, bypassTenant: true }, 'Admin repository access');
  };

  return {
    findMany(args: Record<string, any> = {}) {
      log('findMany');
      return delegate.findMany(args);
    },
    findFirst(args: Record<string, any> = {}) {
      log('findFirst');
      return delegate.findFirst(args);
    },
    count(args: Record<string, any> = {}) {
      log('count');
      return delegate.count(args);
    },
    create(args: Record<string, any>) {
      log('create');
      return delegate.create(args);
    },
    upsert(args: Record<string, any>) {
      log('upsert');
      return delegate.upsert(args);
    },
    update(args: Record<string, any>) {
      log('update');
      return delegate.update(args);
    },
    updateMany(args: Record<string, any>) {
      log('updateMany');
      return delegate.updateMany(args);
    },
    delete(args: Record<string, any>) {
      log('delete');
      return delegate.delete(args);
    },
    deleteMany(args: Record<string, any>) {
      log('deleteMany');
      return delegate.deleteMany(args);
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function createAdminRepository(
  prisma: PrismaClient,
  userId: string,
): AdminRepository {
  return {
    query<T>(action: string, reason: string, fn: (p: PrismaClient) => Promise<T>): Promise<T> {
      logger.info({ action, userId, reason, bypassTenant: true }, 'Admin repository access');
      return fn(prisma);
    },
    hub: loggedModel(prisma.hub as unknown as PrismaDelegate, userId),
    hubVideo: loggedModel(prisma.hubVideo as unknown as PrismaDelegate, userId),
    hubDocument: loggedModel(prisma.hubDocument as unknown as PrismaDelegate, userId),
    hubProject: loggedModel(prisma.hubProject as unknown as PrismaDelegate, userId),
    hubMilestone: loggedModel(prisma.hubMilestone as unknown as PrismaDelegate, userId),
    hubEvent: loggedModel(prisma.hubEvent as unknown as PrismaDelegate, userId),
  };
}
