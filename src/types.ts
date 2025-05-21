export interface ReportMetadata {
  generated_on?: string;
  container_tool?: string;
  title?: string;
  description?: string;
}

export interface CopyFile {
  src: string;
  dest: string;
}

export interface Prepare {
  commands?: string[];
  copy_files?: CopyFile[];
}

export interface MainOperation {
  commands?: string[];
}

export interface Definitions {
  base_image?: string;
  prepare?: Prepare;
  main_operation?: MainOperation;
  target_dirs?: string[];
  exclude_paths?: string[];
  omit_diff_paths?: string[];
  command_diff?: { command: string; outfile: string }[];
}

export interface OperationResult {
  command: string;
  stdout: string;
  stderr: string;
  return_code: number;
}

export interface CommandOutput {
  command: string;
  diff_file: string;
  diff_content: string;
}

export interface DiffReports {
  filesystem_rq?: string[];
  filesystem_urN?: string[];
  command_outputs?: CommandOutput[];
}

export interface EnvDiffReport {
  report_metadata?: ReportMetadata;
  definitions?: Definitions;
  main_operation_results?: OperationResult[];
  diff_reports?: DiffReports;
  [key: string]: unknown;
}
