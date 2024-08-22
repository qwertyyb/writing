import type { IAuthService } from "../types"

const supportAuth = () => false

export const authService = { supportAuth } as IAuthService