import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Har jagah available hoga bina import kiye
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
