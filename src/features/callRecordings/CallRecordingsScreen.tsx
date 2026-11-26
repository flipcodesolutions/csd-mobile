import React, { useEffect, useState } from 'react';
import { appStorage } from '../../core/storage/storage';
import { isAuditRole } from './callRecordingService';
import { AdminCallRecordingsAuditView } from './AdminCallRecordingsAuditView';
import { StaffCallRecordingsView } from './StaffCallRecordingsView';

interface CallRecordingsScreenProps {
  userRole?: string;
}

export const CallRecordingsScreen: React.FC<CallRecordingsScreenProps> = ({
  userRole,
}) => {
  const [currentUser, setCurrentUser] = useState<{
    id?: number;
    name?: string;
    role?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    appStorage.getUserProfile().then((user) => {
      if (mounted && user) {
        const rawRole =
          typeof user.role === 'string'
            ? user.role
            : user.role?.name || user.role?.title || userRole;
        setCurrentUser({
          id: user.id,
          name: user.name,
          role: rawRole,
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [userRole]);

  const effectiveRole = currentUser?.role || userRole;
  if (isAuditRole(effectiveRole)) {
    return <AdminCallRecordingsAuditView />;
  }

  return <StaffCallRecordingsView currentUser={currentUser} />;
};

export default CallRecordingsScreen;

