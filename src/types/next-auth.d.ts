import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      professorId?: string | null;
    };
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser {
    role: UserRole;
    professorId?: string | null;
  }
}
