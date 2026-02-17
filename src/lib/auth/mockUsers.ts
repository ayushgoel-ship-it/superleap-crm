import { UserRole } from "./types";

export interface SeedUser {
  userId: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  phone?: string;
  city?: string;
  profileComplete: boolean;
}

export const SEED_USERS: SeedUser[] = [
  {
    userId: "u_kam_01",
    email: "kam.rajesh@cars24.com",
    password: "SuperLeap@123",
    role: "KAM",
    name: "Rajesh Kumar",
    phone: "+919876543210",
    city: "Gurugram",
    profileComplete: true,
  },
  {
    userId: "u_tl_01",
    email: "tl.priya@cars24.com",
    password: "SuperLeap@123",
    role: "TL",
    name: "Priya Sharma",
    phone: "+919876500011",
    city: "Gurugram",
    profileComplete: true,
  },
  {
    userId: "u_admin_01",
    email: "admin.ops@cars24.com",
    password: "SuperLeap@123",
    role: "Admin",
    name: "Ops Admin",
    phone: "+919999900000",
    city: "Gurugram",
    profileComplete: true,
  },
  {
    userId: "u_kam_new",
    email: "kam.new@cars24.com",
    password: "SuperLeap@123",
    role: "KAM",
    name: "New KAM",
    phone: "",
    city: "",
    profileComplete: false, // forces profile completion on first login
  },
];