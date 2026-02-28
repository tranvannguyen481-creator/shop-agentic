import { APP_PATHS } from "../../../../app/route-config";
import AppLayout from "../../../../shared/layouts/app-layout";
import ManageOrdersView from "../../components/manage-orders-view";
import { useManageOrdersPage } from "../../hooks/use-manage-orders-page";

export const routePath = APP_PATHS.manageOrders;

function ManageOrdersPage() {
  const viewModel = useManageOrdersPage();

  return (
    <AppLayout>
      <ManageOrdersView viewModel={viewModel} />
    </AppLayout>
  );
}

export default ManageOrdersPage;
