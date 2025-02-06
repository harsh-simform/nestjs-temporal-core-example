import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
      validate: (config: Record<string, any>) => {
        const requiredKeys = [
          "TEMPORAL_HOST",
          "TEMPORAL_NAMESPACE",
          "TEMPORAL_TASK_QUEUE",
          "TEMPORAL_CERT",
          "TEMPORAL_KEY",
        ];

        for (const key of requiredKeys) {
          if (!config[key]) {
            throw new Error(`Configuration error: ${key} is required`);
          }
        }

        return config;
      },
    }),
  ],
})
export class ConfigModule {}
