export interface AuthenticatedUser {
  id: string;
  phone: string;
  nickname: string;
}

export interface JwtPayload {
  sub: string;
  phone: string;
  nickname: string;
}
