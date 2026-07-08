import { PageHeader } from "@/components/platform/page-header";
import {
  UniversityAdminNav,
  type UniversityAdminTab,
} from "@/modules/learning/components/university-admin-nav";
import { platformRoutes } from "@/lib/routes";

export function UniversityAdminShell({
  title,
  description,
  current,
  actions,
  children,
}: {
  title: string;
  description?: string;
  current: UniversityAdminTab;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        backHref={platformRoutes.admin.root}
        actions={actions}
      />
      <UniversityAdminNav current={current} />
      {children}
    </div>
  );
}
