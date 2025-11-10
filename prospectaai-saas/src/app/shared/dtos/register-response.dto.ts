export interface RegisterResponse {
  message: string;
  preRegisterId: string;
  scope: 'INTERNAL' | 'OAUTH2';
  email: string;
  displayName: string;
}
