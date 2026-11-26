export type ReviewStatus = 'pending' | 'verified' | 'flagged';

export type ComplianceStatus = 'complete' | 'missing' | 'uploaded' | 'none' | string;

export interface StaffOption {
  id: number;
  name: string;
  role?: string;
}

export interface StaffAuditSummaryRow {
  user_id: number;
  date?: string | null;
  name: string;
  phone?: string;
  email?: string;
  role: string;
  call_follow_ups: number;
  total_follow_ups: number;
  recordings_uploaded: number;
  missing_count: number;
  compliance_status: ComplianceStatus;
  verified_count: number;
  pending_count: number;
  flagged_count: number;
}

export interface AdminSummaryKpis {
  total_staff: number;
  total_follow_ups: number;
  total_call_follow_ups: number;
  total_recordings: number;
  total_missing: number;
  staff_with_missing: number;
  pending_review: number;
  verified_count: number;
  flagged_count: number;
}

export interface StaffSummaryStats {
  total_follow_ups: number;
  call_follow_ups: number;
  recordings_uploaded: number;
  pending_review: number;
  verified_count: number;
  flagged_count: number;
  missing_count: number;
}

export interface StaffDailyRow {
  date: string;
  call_follow_ups: number;
  total_follow_ups: number;
  recordings_uploaded: number;
  missing_count: number;
  compliance_status: ComplianceStatus;
  verified_count: number;
  pending_count: number;
  flagged_count: number;
}

export interface CallRecordingItem {
  id: number;
  user_id?: number;
  user?: {
    id?: number;
    name?: string;
    role?: string;
  };
  original_name: string;
  file_size: number;
  phone_number?: string;
  recording_date: string;
  notes?: string | null;
  review_status: ReviewStatus | string;
  review_remark?: string | null;
  created_at?: string;
}

export interface AuditFollowUpItem {
  id: number;
  lead?: {
    id?: number;
    name?: string;
    phone?: string;
  };
  type?: string;
  follow_up_date?: string;
  follow_up_time?: string;
  status?: string;
  notes?: string;
}

export interface CallRecordingsPagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface SelectedAudioFile {
  uri: string;
  name: string;
  size: number;
  type: string;
}

export interface BatchUploadProgress {
  completed: number;
  total: number;
  percent: number;
}

export interface BatchUploadResult {
  status: boolean;
  partial: boolean;
  batch_id: string;
  uploaded_count: number;
  data: CallRecordingItem[];
  errors: { files: string[]; message: string }[];
}

export const ALLOWED_AUDIO_EXTENSIONS = [
  'mp3',
  'wav',
  'm4a',
  'aac',
  'ogg',
  'oga',
  'opus',
  'amr',
  '3gp',
  '3gpp',
  'webm',
  'mp4',
  'mpeg',
  'mpga',
  'flac',
  'wma',
];

export const MAX_AUDIO_FILE_SIZE = 50 * 1024 * 1024;

