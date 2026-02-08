import { Suspense } from 'react';
import ResetPage from './reset-page';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    }>
      <ResetPage />
    </Suspense>
  );
}
