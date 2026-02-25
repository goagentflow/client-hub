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
  upsert?(args: any): any;
  update(args: any): any;
  updateMany(args: any): any;
  delete(args: any): any;
  deleteMany(args: any): any;
};

/** Scoped accessor that auto-injects tenantId */
export interface ScopedModel {
  findMany(args?: Record<string, any>): Promise<any[]>;
  findFirst(args?: Record<string, any>): Promise<any | null>;
  count(args?: Record<string, any>): Promise<number>;
  create(args: Record<string, any>): Promise<any>;
  upsert(args: Record<string, any>): Promise<any>;
  update(args: Record<string, any>): Promise<any>;
  updateMany(args: Record<string, any>): Promise<{ count: number }>;
  delete(args: Record<string, any>): Promise<any>;
  deleteMany(args: Record<string, any>): Promise<{ count: number }>;
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
    upsert(args: Record<string, any>) {
      if (typeof delegate.upsert !== 'function') {
        throw new Error('Delegate does not support upsert');
      }
      return delegate.upsert({
        ...args,
        create: { ...args.create, tenantId },
        update: { ...args.update, tenantId },
      });
    },
    update(args: Record<string, any>) {
      return delegate.update({ ...args, where: addTenant(args.where) });
    },
    updateMany(args: Record<string, any>) {
      return delegate.updateMany({ ...args, where: addTenant(args.where) });
    },
    delete(args: Record<string, any>) {
      return delegate.delete({ ...args, where: addTenant(args.where) });
    },
    deleteMany(args: Record<string, any>) {
      return delegate.deleteMany({ ...args, where: addTenant(args.where) });
    },
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface TenantRepository {
  tenantId: string;
  hub: ScopedModel;
  hubVideo: ScopedModel;
  hubDocument: ScopedModel;
  portalContact: ScopedModel;
  hubProject: ScopedModel;
  hubMilestone: ScopedModel;
  hubEvent: ScopedModel;
  hubStatusUpdate: ScopedModel;
  hubMessage: ScopedModel;
  hubMember: ScopedModel;
  hubAccessRevocation: ScopedModel;
  hubCrmOrgMap: ScopedModel;
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
    portalContact: scopeModel(prisma.portalContact, tenantId),
    hubProject: scopeModel(prisma.hubProject, tenantId),
    hubMilestone: scopeModel(prisma.hubMilestone, tenantId),
    hubEvent: scopeModel(prisma.hubEvent, tenantId),
    hubStatusUpdate: scopeModel(prisma.hubStatusUpdate, tenantId),
    hubMessage: scopeModel(prisma.hubMessage, tenantId),
    hubMember: scopeModel(prisma.hubMember, tenantId),
    hubAccessRevocation: scopeModel(prisma.hubAccessRevocation, tenantId),
    hubCrmOrgMap: scopeModel(prisma.hubCrmOrgMap, tenantId),
  };
}
