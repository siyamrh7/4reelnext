import './admin.css';

export const metadata = {
  title: '4REEL — Admin',
};

export default function AdminRootLayout({ children }) {
  return <div className="admin">{children}</div>;
}
