import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { AuthModule } from "./auth/auth.module";
import { UserController } from "./user/user.controller";

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [UserController],
})
export class AppModule {}
