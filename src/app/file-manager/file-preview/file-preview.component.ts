import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-file-preview',
  templateUrl: './file-preview.component.html',
  styleUrls: ['./file-preview.component.scss']
})
export class FilePreviewComponent {

  file: any;

  constructor(
    public dialogRef: MatDialogRef<FilePreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
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
