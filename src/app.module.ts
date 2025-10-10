import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TemporalModule } from "nestjs-temporal-core";

// Import activity classes
import { PaymentActivityService } from "./activities/payment.activities";
import { InventoryActivityService } from "./activities/inventory.activities";
import { EmailActivityService } from "./activities/email.activities";
import { NotificationActivityService } from "./activities/notification.activities";
import { WorkflowActivityService } from "./activities/workflow.activities";

// Import services and controllers
import { OrderService } from "./services/order.service";
import { OrderController } from "./controllers/order.controller";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),

    TemporalModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const tlsCert = configService.get("TEMPORAL_TLS_CERT");
        const tlsKey = configService.get("TEMPORAL_TLS_KEY");

        let tlsConfig = undefined;
        if (tlsCert && tlsKey) {
          const crt = Buffer.from(tlsCert, "base64");
          const key = Buffer.from(tlsKey, "base64");
          tlsConfig = {
            clientCertPair: { crt, key },
          };
        }

        return {
          connection: {
            address: configService.get("TEMPORAL_ADDRESS"),
            namespace: configService.get("TEMPORAL_NAMESPACE"),
            ...(tlsConfig && { tls: tlsConfig }),
          },
          taskQueue: configService.get("TEMPORAL_TASK_QUEUE"),
          worker: {
            workflowsPath: require.resolve("./workflows"),
            activityClasses: [
              PaymentActivityService,
              InventoryActivityService,
              EmailActivityService,
              NotificationActivityService,
              WorkflowActivityService,
            ],
            autoStart: true,
          },
          logLevel: "debug",
          enableLogger: true,
          autoRestart: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    PaymentActivityService,
    InventoryActivityService,
    EmailActivityService,
    NotificationActivityService,
    WorkflowActivityService,
  ],
})
export class AppModule {}
