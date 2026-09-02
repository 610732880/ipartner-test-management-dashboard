export type TestRun = {
  run_id: string;
  case_id: string;
  environment: string;
  started_at: string;
  ended_at?: string;
  functional_status: string;
  compatibility_status?: string;
  profiles?: unknown[];
  artifact_paths?: string[];
  expires_at: string;
};

export function retentionDays(status: string) {
  return /FAIL|REVIEW|BLOCKED/i.test(status) ? 180 : 30;
}

export function expiryFor(status: string) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + retentionDays(status));
  return date.toISOString();
}

export function manifestPath(run: TestRun) {
  return `runs/${run.expires_at.slice(0, 10)}/${run.run_id}/manifest.json`;
}
