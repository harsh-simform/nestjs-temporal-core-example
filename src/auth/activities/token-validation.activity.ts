import { Injectable, Logger } from "@nestjs/common";
import { Activity, ActivityMethod } from "nestjs-temporal-core";
import {
  IAuthResponse,
  ITokenValidationActivity,
} from "../interfaces/auth.interface";

@Injectable()
@Activity({
  name: "TokenValidationActivity",
})
export class TokenValidationActivity implements ITokenValidationActivity {
  private readonly logger = new Logger(TokenValidationActivity.name);

  @ActivityMethod({
    name: "validateToken1",
  })
  async validateToken1(token: string): Promise<IAuthResponse> {
    this.logger.log(`Validating token: ${token}`);
    return {
      user: {
        userId: 1,
        email: "user1@example.com",
      },
      roles: ["user"],
    };
  }

  @ActivityMethod({
    name: "validateToken2",
  })
  async validateToken2(token: string): Promise<IAuthResponse> {
    this.logger.log(`Validating token: ${token}`);
    return {
      user: {
        userId: 2,
        email: "user2@example.com",
      },
      roles: ["user"],
    };
  }
}
