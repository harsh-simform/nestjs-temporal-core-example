import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("NestJS Temporal Example API")
    .setDescription("Example application using nestjs-temporal-core")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // CORS for development
  app.enableCors();
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger UI available at: http://localhost:${port}/api`);
}

bootstrap();
