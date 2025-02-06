export interface IAuthUser {
  userId: number;
  email: string;
}

export interface IAuthResponse {
  user: IAuthUser;
  roles: string[];
}

export interface ITokenValidationActivity {
  validateToken(token: string): Promise<IAuthResponse>;
}
