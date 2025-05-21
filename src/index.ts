// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onOpen() {
  DocumentApp.getUi()
    .createMenu('EnvDiff')
    .addItem('Import report', 'showImportDialog')
    .addToUi();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function showImportDialog() {
  const template = HtmlService.createTemplateFromFile('dialog');
  DocumentApp.getUi().showModalDialog(
    template.evaluate().setWidth(600).setHeight(400),
    'Import EnvDiff Report'
  );
}

interface ReportMetadata {
  generated_on?: string;
  container_tool?: string;
  title?: string;
  description?: string;
}

interface CopyFile {
  src: string;
  dest: string;
}

interface Prepare {
  commands?: string[];
  copy_files?: CopyFile[];
}

interface MainOperation {
  commands?: string[];
}

interface Definitions {
  base_image?: string;
  prepare?: Prepare;
  main_operation?: MainOperation;
  target_dirs?: string[];
  exclude_paths?: string[];
  omit_diff_paths?: string[];
  command_diff?: { command: string; outfile: string }[];
}

interface OperationResult {
  command: string;
  stdout: string;
  stderr: string;
  return_code: number;
}

interface CommandOutput {
  command: string;
  diff_file: string;
  diff_content: string;
}

interface DiffReports {
  filesystem_rq?: string[];
  filesystem_urN?: string[];
  command_outputs?: CommandOutput[];
}

interface EnvDiffReport {
  report_metadata?: ReportMetadata;
  definitions?: Definitions;
  main_operation_results?: OperationResult[];
  diff_reports?: DiffReports;
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addReportToDoc(json: string) {
  let reports: EnvDiffReport[];
  try {
    const raw = JSON.parse(json) as EnvDiffReport | EnvDiffReport[];
    if (Array.isArray(raw)) reports = raw;
    else reports = [raw];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    DocumentApp.getUi().alert('Invalid JSON');
    return;
  }

  const requests: GoogleAppsScript.Docs.Schema.Request[] = [];
  let index = 1;

  const insertText = (text: string) => {
    requests.push({ insertText: { location: { index }, text: `${text}\n` } });
    index += text.length + 1;
  };

  const insertBoldText = (text: string) => {
    requests.push({ insertText: { location: { index }, text: `${text}\n` } });
    requests.push({
      updateTextStyle: {
        range: { startIndex: index, endIndex: index + text.length + 1 },
        textStyle: { bold: true },
        fields: 'bold',
      },
    });
    index += text.length + 1;
  };

  const addHeading = (text: string) => {
    const startIndex = index;
    insertText(text);
    requests.push({
      updateParagraphStyle: {
        range: { startIndex, endIndex: index },
        paragraphStyle: { namedStyleType: 'HEADING_1' },
        fields: 'namedStyleType',
      },
    });
    requests.push({
      updateTextStyle: {
        range: { startIndex, endIndex: index },
        textStyle: { bold: true, fontSize: { magnitude: 11, unit: 'PT' } },
        fields: 'bold,fontSize',
      },
    });
  };

  const createBullets = (text: string) => {
    const startIndex = index;
    insertText(text);
    index = startIndex + text.replace(/^\t*/gm, '').length + 1;
    requests.push({
      createParagraphBullets: {
        range: { startIndex, endIndex: index },
        bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
      },
    });
  };

  reports.forEach(report => {
    const title = report.report_metadata?.title ?? 'EnvDiff Report';
    addHeading(title);

    if (report.report_metadata) {
      const meta = report.report_metadata;
      const lines: string[] = [];
      if (meta.generated_on)
        lines.push(`Report generated on: ${meta.generated_on}`);
      if (meta.container_tool)
        lines.push(`Container tool: ${meta.container_tool}`);
      if (meta.description) {
        lines.push('Description:');
        lines.push(`\t${meta.description}`);
      }
      if (lines.length > 0) {
        insertBoldText('Metadata');
        createBullets(
          lines.map(line => line.replace(/\n/g, '\x0b')).join('\n')
        );
      }
    }

    if (report.definitions) {
      const defLines: string[] = [];
      const defs = report.definitions;
      if (defs.base_image) defLines.push(`base_image: ${defs.base_image}`);
      if (defs.prepare) {
        defLines.push('prepare:');
        if (Array.isArray(defs.prepare.copy_files)) {
          defLines.push('\tcopy_files:');
          for (const cf of defs.prepare.copy_files) {
            defLines.push(`\t\t${cf.src} -> ${cf.dest}`);
          }
        }
        if (Array.isArray(defs.prepare.commands)) {
          defLines.push('\tcommands:');
          for (const c of defs.prepare.commands) {
            defLines.push(`\t\t${c}`);
          }
        }
      }
      if (Array.isArray(defs.target_dirs)) {
        defLines.push(`Target dirs: ${defs.target_dirs.join(', ')}`);
      }
      if (Array.isArray(defs.exclude_paths)) {
        defLines.push(`Exclude paths: ${defs.exclude_paths.join(', ')}`);
      }
      if (Array.isArray(defs.omit_diff_paths)) {
        defLines.push(`Omit diff paths: ${defs.omit_diff_paths.join(', ')}`);
      }
      if (defLines.length > 0) {
        insertText('');
        insertBoldText('Definitions');
        createBullets(
          defLines.map(line => line.replace(/\n/g, '\x0b')).join('\n')
        );
      }
    }

    if (Array.isArray(report.main_operation_results)) {
      const lines: string[] = [];
      report.main_operation_results.forEach(r => {
        lines.push(`${r.command} (exit code ${r.return_code})`);
        if (r.stdout) lines.push(`\tstdout:\n${r.stdout}`);
        if (r.stderr) lines.push(`\tstderr:\n${r.stderr}`);
      });
      if (lines.length > 0) {
        insertText('');
        insertBoldText('Main Operation Results');
        createBullets(
          lines.map(line => line.replace(/\n/g, '\x0b')).join('\n')
        );
      }
    }

    if (report.diff_reports) {
      const diff = report.diff_reports;
      const lines: string[] = [];
      lines.push('Filesystem diff (rq):');
      if (Array.isArray(diff.filesystem_rq)) {
        diff.filesystem_rq.forEach(d => lines.push(`\t${d}`));
      }
      lines.push('Filesystem diff (urN):');
      if (Array.isArray(diff.filesystem_urN)) {
        diff.filesystem_urN.forEach(d => lines.push(`\t${d}`));
      }

      if (Array.isArray(diff.command_outputs)) {
        diff.command_outputs.forEach(c => {
          lines.push(`Command diff for: ${c.command} (file: ${c.diff_file})`);
          lines.push(`\t${c.diff_content}`);
        });
      }

      insertText('');
      insertBoldText('Diff Reports');
      createBullets(lines.map(line => line.replace(/\n/g, '\x0b')).join('\n'));
    }
  });

  Docs.Documents!.batchUpdate(
    { requests },
    DocumentApp.getActiveDocument().getId()
  );
}
