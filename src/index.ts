// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('EnvDiff')
    .addItem('Import report', 'showImportDialog')
    .addToUi();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function showImportDialog() {
  const template = HtmlService.createTemplateFromFile('dialog');
  SpreadsheetApp.getUi().showModalDialog(
    template.evaluate().setWidth(600).setHeight(400),
    'Import EnvDiff Report'
  );
}

interface ReportMetadata {
  title?: string;
}

interface EnvDiffReport {
  report_metadata?: ReportMetadata;
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function addReportToDoc(json: string, docId: string) {
  let report: EnvDiffReport;
  try {
    report = JSON.parse(json) as EnvDiffReport;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    SpreadsheetApp.getUi().alert('Invalid JSON');
    return;
  }

  const requests: GoogleAppsScript.Docs.Schema.Request[] = [
    {
      insertText: {
        location: { index: 1 },
        text: JSON.stringify(report, null, 2),
      },
    },
  ];

  Docs.Documents!.batchUpdate({ requests }, docId);
}
