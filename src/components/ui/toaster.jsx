import React from 'react';
import { Toaster as SonnerToaster } from 'sonner';

const Toaster = () => (
  <SonnerToaster
    position="top-right"
    richColors
    closeButton
    duration={3500}
    toastOptions={{
      className: 'sonner-toast',
    }}
  />
);

export { Toaster };


