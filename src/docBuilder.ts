export class DocumentBuilder {
  public requests: GoogleAppsScript.Docs.Schema.Request[] = [];
  private index = 1;

  insertText(text: string) {
    this.requests.push({
      insertText: { location: { index: this.index }, text: `${text}\n` },
    });
    this.index += text.length + 1;
  }

  insertBoldText(text: string) {
    this.requests.push({
      insertText: { location: { index: this.index }, text: `${text}\n` },
    });
    this.requests.push({
      updateTextStyle: {
        range: {
          startIndex: this.index,
          endIndex: this.index + text.length + 1,
        },
        textStyle: { bold: true },
        fields: 'bold',
      },
    });
    this.index += text.length + 1;
  }

  addHeading(text: string) {
    const startIndex = this.index;
    this.insertText(text);
    this.requests.push({
      updateParagraphStyle: {
        range: { startIndex, endIndex: this.index },
        paragraphStyle: { namedStyleType: 'HEADING_1' },
        fields: 'namedStyleType',
      },
    });
    this.requests.push({
      updateTextStyle: {
        range: { startIndex, endIndex: this.index },
        textStyle: { bold: true, fontSize: { magnitude: 11, unit: 'PT' } },
        fields: 'bold,fontSize',
      },
    });
  }

  createBullets(text: string) {
    const startIndex = this.index;
    this.insertText(text);
    this.index = startIndex + text.replace(/^\t*/gm, '').length + 1;
    this.requests.push({
      createParagraphBullets: {
        range: { startIndex, endIndex: this.index },
        bulletPreset: 'BULLET_DISC_CIRCLE_SQUARE',
      },
    });
  }
}
