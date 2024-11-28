import { Component, Inject } from '@angular/core';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
@Component({
  selector: 'app-modals',
  templateUrl: './modals.component.html',
  styleUrls: ['./modals.component.scss']
})
export class ModalsComponent {

  newFolderName: string = '';
  folderName: string = '';
  actionType: string = '';
  folder: any;
  selectedFile: any = null;
  selectedFolder: any;
  list;
  showMsg = false;
  tags: any;
  readonly separatorKeysCodes: number[] = [13, 188]; // ENTER and COMMA
  zipName: string = '';

  constructor(
    public dialogRef: MatDialogRef<ModalsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.folderName = data.folder ? data.folder.name : '';
    this.actionType = data.actionType || 'create'; // Default to create if no actionType is provided
    this.folder = data.folder;
    if (this.folder?.tags) this.tags = [...this.folder.tags];
    if (Array.isArray(this.folder)) {
      this.showMsg = true;
    } else {
      this.showMsg = false;
    }
    if (this.folder) this.list = data.list.filter((item: any) => item.id !== data.folder.parentId);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      // Read the file as Base64
      reader.onload = () => {
        this.selectedFile = {
          name: file.name,
          type: file.type,
          size: file.size,
          content: reader.result as string,
        };
      };

      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        reader.readAsDataURL(file); // Base64 for images and PDF
      } else {
        reader.readAsText(file); // Plain text for .txt files
      }
    }
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.tags.push(value);
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.actionType === 'create') {
      this.dialogRef.close({ action: this.actionType, folder: this.folder, folderName: this.newFolderName });
    } else if (this.actionType === 'rename') {
      this.dialogRef.close({ action: this.actionType, folder: this.folder, folderName: this.folderName });
    } else if (this.actionType === 'delete') {
      this.dialogRef.close({ action: this.actionType, folder: this.folder });
    } else if (this.actionType === 'upload') {
      this.dialogRef.close({ action: this.actionType, folder: this.folder, file: this.selectedFile });
    } else if (this.actionType === 'move' || this.actionType === 'copy') {
      this.dialogRef.close({ action: this.actionType, folder: this.folder, selectedFolder: this.selectedFolder });
    } else if (this.actionType === 'tags') {
      this.dialogRef.close({ action: this.actionType, folder: this.folder, tags: this.tags });
    } else if (this.actionType === 'compress') {
      this.dialogRef.close({ action: this.actionType, folder: this.folder, zipName: this.zipName });
    } else if (this.actionType === "revert") {
      this.dialogRef.close({ action: this.actionType, folder: this.folder, tags: this.tags });
    }
  }

}