import { DriverProtected } from "@/src/components/DriverProtected";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DriverProtected>{children}</DriverProtected>;
}
