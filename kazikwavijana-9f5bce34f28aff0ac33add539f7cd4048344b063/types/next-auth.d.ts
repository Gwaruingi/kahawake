import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "jobseeker" | "company";
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "jobseeker" | "company";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "admin" | "jobseeker" | "company";
    id: string;
  }
}
