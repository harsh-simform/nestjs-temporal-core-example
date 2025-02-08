export interface IAuthUser {
  userId: number;
  email: string;
}

export interface IAuthResponse {
  user: IAuthUser;
  roles: string[];
}

export interface ITokenValidationActivity {
  validateToken1(token: string): Promise<IAuthResponse>;
  validateToken2(token: string): Promise<IAuthResponse>;
}
