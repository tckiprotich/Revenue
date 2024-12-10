// lib/db/seed.ts
import { db } from './drizzle';
import { services } from './schema';
import { config } from 'dotenv';
import servicesData from '@/app/pay/data.json';

// Load environment variables - use same config as drizzle.config.ts
config({ path: '.env.local' });

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Insert services
    for (const service of servicesData.municipal_services) {
      try {
        await db.insert(services).values({
          service_code: service.service_code,
          service_name: service.service_name,
          description: service.description,
          service_type: service.service_type,
          billing_rules: service.billing_rules,
          billing_period: service.billing_period,
          is_active: true
        }).onConflictDoUpdate({
          target: services.service_code,
          set: {
            service_name: service.service_name,
            description: service.description,
            billing_rules: service.billing_rules,
            billing_period: service.billing_period,
            is_active: true
          }
        });
        console.log(`✓ Seeded service: ${service.service_name}`);
      } catch (error) {
        console.error(`Failed to seed service ${service.service_name}:`, error);
      }
    }

    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

seed();