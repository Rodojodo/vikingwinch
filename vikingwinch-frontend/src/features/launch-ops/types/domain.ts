export interface LaunchRecord {
  id: number;
  launch_number: number | null;
  timestamp: string | null;
  remark: string | null;
  burn: boolean;
  operator_sn: string;
}
