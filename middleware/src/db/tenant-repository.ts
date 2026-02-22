/**
 * TenantRepository — tenant-guarded data access layer.
 *
 * Wraps Prisma client and auto-injects tenant_id into all queries.
 * Every findMany/findFirst/create/update/delete is scoped to the
 * authenticated user's tenant, preventing cross-tenant data access.
 */

import type { PrismaClient } from '@prisma/client';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyDelegate = {
  findMany(args?: any): any;
  findFirst(args?: any): any;
  count(args?: any): any;
  create(args: any): any;
  update(args: any): any;
  delete(args: any): any;
};

/** Scoped accessor that auto-injects tenantId */
export interface ScopedModel {
  findMany(args?: Record<string, any>): Promise<any[]>;
  findFirst(args?: Record<string, any>): Promise<any | null>;
  count(args?: Record<string, any>): Promise<number>;
  create(args: Record<string, any>): Promise<any>;
  update(args: Record<string, any>): Promise<any>;
  delete(args: Record<string, any>): Promise<any>;
}

function scopeModel(delegate: AnyDelegate, tenantId: string): ScopedModel {
  const addTenant = (where: Record<string, any> = {}): Record<string, any> => ({
    ...where,
    tenantId,
  });

  return {
    findMany(args: Record<string, any> = {}) {
      return delegate.findMany({ ...args, where: addTenant(args.where) });
    },
    findFirst(args: Record<string, any> = {}) {
      return delegate.findFirst({ ...args, where: addTenant(args.where) });
    },
    count(args: Record<string, any> = {}) {
      return delegate.count({ ...args, where: addTenant(args.where) });
    },
    create(args: Record<string, any>) {
      return delegate.create({ ...args, data: { ...args.data, tenantId } });
    },
    update(args: Record<string, any>) {
      return delegate.update({ ...args, where: addTenant(args.where) });
    },
    delete(args: Record<string, any>) {
      return delegate.delete({ ...args, where: addTenant(args.where) });
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface TenantRepository {
  tenantId: string;
  hub: ScopedModel;
  hubVideo: ScopedModel;
  hubDocument: ScopedModel;
  hubProject: ScopedModel;
  hubMilestone: ScopedModel;
  hubEvent: ScopedModel;
}

export function createTenantRepository(
  prisma: PrismaClient,
  tenantId: string,
): TenantRepository {
  return {
    tenantId,
    hub: scopeModel(prisma.hub, tenantId),
    hubVideo: scopeModel(prisma.hubVideo, tenantId),
    hubDocument: scopeModel(prisma.hubDocument, tenantId),
    hubProject: scopeModel(prisma.hubProject, tenantId),
    hubMilestone: scopeModel(prisma.hubMilestone, tenantId),
    hubEvent: scopeModel(prisma.hubEvent, tenantId),
  };
}
