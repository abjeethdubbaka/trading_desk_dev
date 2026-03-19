import React from 'react';

const UserNotRegisteredError = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">User Not Registered</h1>
        <p className="text-lg">Please contact support to register your account.</p>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
