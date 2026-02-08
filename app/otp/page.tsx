import { Suspense } from 'react';
import OTPPage from './otp-page';

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
      <OTPPage />
    </Suspense>
  );
}
