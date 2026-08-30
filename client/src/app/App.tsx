import { Navigate, Route, Routes } from 'react-router-dom';
import { DirectoryPage } from '@/features/directory/components/DirectoryPage.tsx';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<DirectoryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
