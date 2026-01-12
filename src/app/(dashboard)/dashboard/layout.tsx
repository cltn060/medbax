import { DashboardLayout } from "@/components/dashboard/layout/DashboardLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
