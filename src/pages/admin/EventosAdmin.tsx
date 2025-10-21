import AdminLayout from "@/components/admin/AdminLayout";
import { EventosList } from "@/components/admin/EventosList";

const EventosAdmin = () => {
  return (
    <AdminLayout>
      <EventosList />
    </AdminLayout>
  );
};

export default EventosAdmin;