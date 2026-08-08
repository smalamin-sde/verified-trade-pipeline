import { Role } from '../enums/role.enum';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: Role[];
}
