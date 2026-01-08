export interface AsyncTaskPanelDto {
  taskId: string;
  query: string;
  platform: 'GOOGLE_MAPS' | 'OTHER';
  status: 'PROCESSING' | 'PROCESSED';
}

