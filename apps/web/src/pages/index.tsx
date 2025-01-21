import React from 'react';
import { WalletBanner } from '../../lib/wallet';

export default function Home() {
  return (
    <main>
      <h1>StepSeal</h1>
      <p>Track your daily habits on-chain and earn rewards.</p>
      <WalletBanner />
      <a href="/checkin">Go to Check-In</a>
    </main>
  );
}
