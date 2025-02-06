import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import { IAuthResponse } from "../auth/interfaces/auth.interface";

@Controller("users")
@UseGuards(AuthGuard)
export class UserController {
  @Get("me")
  getProfile(@Request() req: { user: IAuthResponse }) {
    return req.user;
  }
}
