import { PrismaClient, Role, TicketStatus, TicketPriority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('demo1234', 10);

  // Create owner user
  const owner = await prisma.user.create({
    data: {
      email: 'owner@opendesk.demo',
      password,
      name: 'Demo Owner',
    },
  });

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      memberships: {
        create: {
          userId: owner.id,
          role: Role.OWNER,
        },
      },
    },
  });

  // Create sample tickets
  const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED'];
  const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  for (let i = 1; i <= 10; i++) {
    await prisma.ticket.create({
      data: {
        workspaceId: workspace.id,
        subject: `Sample ticket #${i}`,
        description: `This is a demo ticket for testing the kanban board.`,
        status: statuses[i % 4],
        priority: priorities[i % 4],
        customerEmail: `customer${i}@example.com`,
        customerName: `Customer ${i}`,
      },
    });
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });