import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiRequest } from '@/lib/api';

interface ReportSummary {
  farmName: string;
  scenarioName: string;
  score: number;
  yieldKg: number;
  waterLiters: number;
  status: 'ok' | 'warning' | 'at-risk';
  shareText: string;
}

interface Certificate {
  learnerName: string;
  farmName: string;
  score: number;
  verifyToken: string;
  certificateId: string;
}

export default function ReportsScreen() {
  const theme = useTheme();
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<{ report: ReportSummary }>('/reports')
      .then((response) => setReport(response.report))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load report summary.');
      });
  }, []);

  async function generateCertificate() {
    try {
      const response = await apiRequest<{ certificate: Certificate }>('/reports/certificate', {
        method: 'POST',
        body: JSON.stringify({
          learnerName: 'Amina Ndlovu',
          farmName: report?.farmName || 'Green Valley',
          score: report?.score ?? 88,
          issueDate: '2026-11-05',
        }),
      });
      setCertificate(response.certificate);
      setError('');
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : 'Unable to generate certificate.');
    }
  }

  return (
    <AppScreen
      title="Certificates & reports"
      subtitle="Share verified farm performance and downloadable completion records from saved runs.">
      {error ? <ThemedText style={{ color: theme.error }}>{error}</ThemedText> : null}

      {report ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
          <ThemedText type="smallBold">Farm report</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{report.farmName}</ThemedText>
          <ThemedText type="smallBold">Scenario: {report.scenarioName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Score: {report.score}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Yield: {report.yieldKg} kg</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Water use: {report.waterLiters} L</ThemedText>
          <ThemedText type="smallBold" style={{ color: report.status === 'ok' ? theme.success : theme.warning }}>
            Status: {report.status}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{report.shareText}</ThemedText>
        </View>
      ) : null}

      <PrimaryButton onPress={generateCertificate}>Generate certificate</PrimaryButton>

      {certificate ? (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
          <ThemedText type="smallBold">Certificate</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{certificate.learnerName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Farm: {certificate.farmName}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Score: {certificate.score}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Token: {certificate.verifyToken}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">ID: {certificate.certificateId}</ThemedText>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
});
