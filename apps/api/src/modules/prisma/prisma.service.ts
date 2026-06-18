import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@levithon/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Perform soft delete on a given table model by record ID.
   */
  async softDelete(modelName: string, id: string) {
    const dbModel = (this as any)[modelName.toLowerCase()];
    if (!dbModel) {
      throw new Error(`Model ${modelName} not found in database client.`);
    }
    return dbModel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
