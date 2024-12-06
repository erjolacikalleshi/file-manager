import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FileData {
  name: string;
  type: string;
  size: number;
  content: string | Uint8Array; // Content can be Base64 or text depending on the file type
}


@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss']
})
export class FilePreviewComponent {

  file: FileData;

  constructor(
    public dialogRef: MatDialogRef<FilePreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { file: FileData }
  ) {
    if (!this.data || !this.data.file) {
      console.error('No file data provided');
    }
    this.file = data.file;
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
