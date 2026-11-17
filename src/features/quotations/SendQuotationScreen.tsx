import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { CreateQuotationScreen } from './CreateQuotationScreen';
import { QuotationsListScreen } from './QuotationsListScreen';

interface SendQuotationScreenProps {
  onOpenDrawer?: () => void;
  initialTab?: 'builder' | 'archive';
  prefilledLeadId?: number;
  route?: any;
  navigation?: any;
}

export const SendQuotationScreen: React.FC<SendQuotationScreenProps> = ({
  onOpenDrawer,
  initialTab = 'builder',
  prefilledLeadId,
  route,
  navigation,
}) => {
  const [activeView, setActiveView] = useState<'builder' | 'archive'>(initialTab);

  const effectiveLeadId = route?.params?.leadId || prefilledLeadId;

  // If a lead is passed via route params, always open builder view
  useEffect(() => {
    if (effectiveLeadId) {
      setActiveView('builder');
    }
  }, [effectiveLeadId]);

  return (
    <View style={styles.container}>
      {activeView === 'builder' ? (
        <CreateQuotationScreen
          onNavigateToArchive={() => setActiveView('archive')}
          prefilledLeadId={effectiveLeadId}
        />
      ) : (
        <QuotationsListScreen
          onNavigateToCreate={() => setActiveView('builder')}
          onOpenDrawer={onOpenDrawer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
