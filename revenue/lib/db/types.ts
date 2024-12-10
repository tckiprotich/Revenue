// lib/db/types.ts
import { InferSelectModel } from 'drizzle-orm';
import * as schema from './schema';

export type User = InferSelectModel<typeof schema.users>;
export type ServiceAccount = InferSelectModel<typeof schema.serviceAccounts>;
export type Bill = InferSelectModel<typeof schema.bills>;
export type Payment = InferSelectModel<typeof schema.payments>;