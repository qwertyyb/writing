import type { IAuthService } from "../types";

export class AuthService implements IAuthService {
  [x: string]: Function;
  supportAuth = () => false
}