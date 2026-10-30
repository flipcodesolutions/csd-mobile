import { PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { showErrorToast, showSuccessToast } from './toast';

export interface CsvExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Escapes a single CSV cell value per RFC 4180:
 * Encloses in double quotes if it contains commas, double quotes, or newlines.
 */
const escapeCsvCell = (cell: any): string => {
  if (cell === null || cell === undefined) return '';
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Request Android external storage write permissions for older Android versions (< Android 10 / API 29).
 */
const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  if (Number(Platform.Version) >= 29) return true; // Scoped storage on Android 10+ handles DownloadDir without explicit prompt

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission Required',
        message: 'Defence Autolink needs storage access to save CSV reports to your Downloads folder.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.log('Permission request error:', err);
    return false;
  }
};

/**
 * Export structured data to CSV and save directly to Downloads/CSD/<filename>.csv
 */
export const exportCsvToFile = async ({
  filename,
  headers,
  rows,
}: CsvExportOptions): Promise<{ success: boolean; filePath?: string }> => {
  try {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      showErrorToast('Permission Denied', 'Storage permission is required to save CSV files.');
      return { success: false };
    }

    // 1. Build CSV content with UTF-8 BOM so Microsoft Excel & LibreOffice display correctly
    const headerLine = headers.map(escapeCsvCell).join(',');
    const dataLines = rows
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\r\n');
    const csvContent = `\uFEFF${headerLine}\r\n${dataLines}\r\n`;

    // 2. Determine target directory: Downloads/CSD on Android, Documents/CSD on iOS
    const { dirs } = ReactNativeBlobUtil.fs;
    const baseDir =
      Platform.OS === 'android' ? dirs.DownloadDir : dirs.DocumentDir;
    const csdDir = `${baseDir}/CSD`;

    // 3. Ensure the /CSD folder exists
    const dirExists = await ReactNativeBlobUtil.fs.isDir(csdDir);
    if (!dirExists) {
      await ReactNativeBlobUtil.fs.mkdir(csdDir);
    }

    // 4. Clean filename with extension
    const dateStamp = new Date().toISOString().split('T')[0];
    const safeBaseName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFilename = safeBaseName.endsWith('.csv')
      ? safeBaseName
      : `${safeBaseName}_${dateStamp}.csv`;
    const targetFilePath = `${csdDir}/${finalFilename}`;

    // 5. Write file with UTF-8 encoding
    await ReactNativeBlobUtil.fs.writeFile(targetFilePath, csvContent, 'utf8');

    // 6. Scan file on Android so it appears immediately in file managers & Downloads app
    if (Platform.OS === 'android') {
      await ReactNativeBlobUtil.fs.scanFile([
        { path: targetFilePath, mime: 'text/csv' },
      ]);
    }

    // 7. Show success feedback
    const displayFolder = Platform.OS === 'android' ? 'Downloads/CSD' : 'Documents/CSD';
    showSuccessToast(
      'CSV Downloaded',
      `Saved to ${displayFolder}/${finalFilename}`
    );

    return { success: true, filePath: targetFilePath };
  } catch (error: any) {
    console.log('Error exporting CSV:', error);
    showErrorToast(
      'Export Failed',
      error?.message || 'Unable to write CSV file to storage.'
    );
    return { success: false };
  }
};
