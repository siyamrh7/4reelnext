import AdminNav from './AdminNav';

export default function DashboardLayout({ children }) {
  return (
    <div className="a-shell">
      <AdminNav />
      <main className="a-main">{children}</main>
    </div>
  );
}
