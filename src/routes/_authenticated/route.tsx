import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", data.user.id)
      .limit(1);
    if (!roles || roles.length === 0) {
      await supabase.auth.signOut();
      throw redirect({ to: "/cadastro/aguardando-liberacao" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <AppLayout />;
}

export function AuthenticatedOutletOnly() {
  return <Outlet />;
}