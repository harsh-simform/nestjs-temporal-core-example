import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  try {
    const app = await NestFactory.create(AppModule, {
      logger: ["error", "warn", "log", "debug"],
    });

    // Add global prefix
    app.setGlobalPrefix("api");

    // Enable CORS
    app.enableCors({
      origin: "*",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      credentials: true,
    });
    app.enableShutdownHooks();

    await app.listen(4000);

    const url = await app.getUrl();
    logger.log(`🚀 Application is running on: ${url}`);

    // Handle shutdown
    process.on("SIGTERM", async () => {
      logger.log("SIGTERM signal received. Closing HTTP server...");
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start application:", error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error("Unhandled bootstrap error:", error);
  process.exit(1);
});
