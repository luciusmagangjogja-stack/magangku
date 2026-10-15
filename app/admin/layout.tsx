import type { ReactNode } from "react";
import "./admin.css";

export default function AdminRootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}