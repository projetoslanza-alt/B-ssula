import { redirect } from "next/navigation";
import { platformRoutes } from "@/lib/routes";
export default function Page() { redirect(platformRoutes.reports.learning); }