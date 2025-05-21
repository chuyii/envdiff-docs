import { DocumentBuilder } from './docBuilder';
import type { EnvDiffReport } from './types';

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

  const builder = new DocumentBuilder();

  reports.forEach(report => {
    const title = report.report_metadata?.title ?? 'EnvDiff Report';
    builder.addHeading(title);

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
        builder.insertBoldText('Metadata');
        builder.createBullets(
          lines.map(line => line.replace(/\n/g, '\x0b')).join('\n')
        );
      }
    }

    if (report.definitions) {
      const defLines: string[] = [];
      const defs = report.definitions;
      if (defs.base_image) defLines.push(`base_image: ${defs.base_image}`);
      if (Array.isArray(defs.target_dirs)) {
        defLines.push(`Target dirs: ${defs.target_dirs.join(', ')}`);
      }
      if (Array.isArray(defs.exclude_paths)) {
        defLines.push(`Exclude paths: ${defs.exclude_paths.join(', ')}`);
      }
      if (Array.isArray(defs.omit_diff_paths)) {
        defLines.push(`Omit diff paths: ${defs.omit_diff_paths.join(', ')}`);
      }
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
      if (defLines.length > 0) {
        builder.insertText('');
        builder.insertBoldText('Definitions');
        builder.createBullets(
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
        builder.insertText('');
        builder.insertBoldText('Main Operation Results');
        builder.createBullets(
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

      builder.insertText('');
      builder.insertBoldText('Diff Reports');
      builder.createBullets(
        lines.map(line => line.replace(/\n/g, '\x0b')).join('\n')
      );
    }
  });

  Docs.Documents!.batchUpdate(
    { requests: builder.requests },
    DocumentApp.getActiveDocument().getId()
  );
}
