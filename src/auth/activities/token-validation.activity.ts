import { Injectable, Logger } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";
import {
  IAuthResponse,
  ITokenValidationActivity,
} from "../interfaces/auth.interface";

@Injectable()
@Activity()
export class TokenValidationActivity implements ITokenValidationActivity {
  private readonly logger = new Logger(TokenValidationActivity.name);

  @ActivityMethod()
  async validateToken(token: string): Promise<IAuthResponse> {
    this.logger.log(`Validating token: ${token}`);
    return {
      user: {
        userId: 1,
        email: "user@example.com",
      },
      roles: ["user"],
    };
  }
}
