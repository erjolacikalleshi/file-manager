import { Component, HostListener, ViewChild } from "@angular/core";
import { FileManagerService } from "../services/file-manager.service";
import { MatDialog } from "@angular/material/dialog";
import { ModalsComponent } from "../modals/modals.component";
import { MatSnackBar } from "@angular/material/snack-bar";
import { FileNode } from "../models/file-node.model";
import { Observable } from "rxjs";
import { Store } from "@ngrx/store";
import { selectTabData } from "../store/file.selectors";
import { tabDataLoaded } from "../store/file.actions";

@Component({
  selector: "app-file-manager",
  templateUrl: "./file-manager.component.html",
  styleUrls: ["./file-manager.component.scss"],
})
export class FileManagerComponent {

  files: FileNode[] = [];
  folders: FileNode[] = [];
  data: FileNode[] = [];
  isSmallScreen: boolean = false;
  @ViewChild("folderTreeSidenav") folderTreeSidenav: any;
  files$!: Observable<{ [key: string]: { data: FileNode[] } }>;
  fileState: { [key: string]: { data: FileNode[] } } | null = null;
  folderId: string = '';

  constructor(
    private fileManagerService: FileManagerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private store: Store
  ) {
    this.checkScreenSize();

    this.files$ = this.store.select(selectTabData);

    this.files$.subscribe(res => {
      this.fileState = res;
    })
  }

  ngOnInit(): void {
    this.fileManagerService.getFileTreeUpdates().subscribe({
      next: (updatedTree) => {
        this.data = updatedTree;
        this.folders = updatedTree
          .filter((item) => item.isFolder === true)
      },
      error: (err) => console.error("File tree update error", err),
    });
  }

  @HostListener("window:resize", [])
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isSmallScreen = window.innerWidth <= 768;
    // Open sidenav if on large screen
    if (!this.isSmallScreen && this.folderTreeSidenav) {
      this.folderTreeSidenav.open();
    }
  }

  onFolderOpened(folderId: string): void {
    console.log("Files received:", folderId);
    this.folderId = folderId;

    if (this.fileState) {
      if (!this.fileState[folderId]) {
        this.getFiles(folderId)

      }
      else {
        this.files = this.fileState[folderId].data;
      }
    }
  }

  getFiles(folderId: string) {
    this.fileManagerService.getChildren(folderId).subscribe((files) => {
      this.files = files;
      this.store.dispatch(tabDataLoaded({ tabId: folderId, data: this.files }))
    });
  }

  getData() {
    this.fileManagerService.getDataTree().subscribe((data: FileNode[]) => {
      this.data = data;
      this.folders = data
        .filter((item) => item.isFolder === true)
    });
  }

  findChildFiles(folderId: string, items: FileNode[]): FileNode[] {
    return items.filter(item => item.parentId === folderId && item.isFolder === false);
  }

  findChildFolders(folderId: string, items: FileNode[]): FileNode[] {
    return items.filter(item => item.parentId === folderId && item.isFolder === true);
  }

  openDialog(event: any): void {
    const dialogRef = this.dialog.open(ModalsComponent, {
      width: "400px",
      data: {
        actionType: event.action,
        folder: event.data,
        list: this.folders,
        files: event.data ? this.findChildFiles(event.data.id, this.data) : [],
        folders: event.data ? this.findChildFolders(event.data.id, this.data) : this.folders.filter((item: FileNode) => item.parentId === null)
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        switch (result.action) {
          case "create":
            this.onCreateFolder(result.folderName, result.folder ? result.folder : null);
            break;
          case "rename":
            this.onRenameFolder(result.folder, result.folderName);
            break;
          case "delete":
            this.onDeleteFolder(result.folder);
            break;
          case "upload":
            this.onUploadFile(result.folder, result.file);
            break;
          case "move":
            this.onMoveFile(result.folder, result.selectedFolder);
            break;
          case "copy":
            this.onCopyFile(result.folder, result.selectedFolder);
            break;
          case "tags":
            this.onAddTags(result.folder, result.tags);
            break;
          case "compress":
            this.onCompressFile(result.folder, result.zipName);
            break;
          case "revert":
            this.onRevertFile(result.folder);
            break;
          default:
            console.log("Unknown action:", result.action);
            break;
        }
      }
    });
  }

  onCreateFolder(folderName: string, targetNode: FileNode | null): void {
    const parentId = targetNode ? targetNode.id : null;
    this.fileManagerService.createFolder(folderName, parentId).subscribe(
      (newFolder) => {
        this.snackBar.open("Folder created successfully!", "Close", {
          duration: 3000,
        });
        this.getData();
        this.getFiles(this.folderId)
      },
      (error) => {
        this.snackBar.open("Error creating folder.", "Close", {
          duration: 3000,
        });
        console.error("Error creating folder:", error);
      },
    );
  }

  onDeleteFolder(folder: FileNode): void {
    let folderIds;
    if (Array.isArray(folder)) {
      folderIds = folder;
    } else {
      folderIds = folder.id;
    }

    this.fileManagerService.deleteFolder(folderIds).subscribe({
      next: () => {
        if (folder.isFolder) 
        this.snackBar.open("Folder deleted successfully!", "Close", {
          duration: 3000,
        });
        else (folder.isFolder) 
          this.snackBar.open("File deleted successfully!", "Close", {
            duration: 3000,
          });
        this.getData();
        this.getFiles(this.folderId)
      },
      error: (err) => {
        this.snackBar.open("Failed to delete folder.", "Close", {
          duration: 3000,
        });
        console.error("Failed to delete node:", err);
      },
    });
  }

  onRenameFolder(folder: FileNode, newName: string): void {
    this.fileManagerService.renameFolder(folder, newName).subscribe({
      next: () => {
        if (folder.isFolder)
          this.snackBar.open("Folder updated successfully!", "Close", {
            duration: 3000,
          });
        else this.snackBar.open("File updated successfully!", "Close", {
          duration: 3000,
        });
        this.getData();
        this.getFiles(this.folderId)
      },
      error: (err) => {
        if (folder.isFolder) this.snackBar.open("Failed to update folder.", "Close", {
          duration: 3000,
        });
        else this.snackBar.open("Failed to update file.", "Close", {
          duration: 3000,
        });
      },
    });
  }

  onUploadFile(folder: FileNode, file: FileNode): void {
    if (file) {
      const fileData: FileNode = {
        id: this.generateUniqueId(),
        name: file.name,
        parentId: folder.id,
        date: new Date().toLocaleDateString(),
        size: file.size !== undefined ? parseFloat((file.size / 1024).toFixed(2)) : 0,
        isFolder: false,
        type: file.type,
        content: file.content,
        tags: [],
        versions: []
      };

      this.fileManagerService.uploadFile(fileData).subscribe({
        next: (response) => {
          this.getData();
          this.getFiles(this.folderId)
          this.snackBar.open("File uploaded successfully!", "Close", {
            duration: 3000,
          });
        },
        error: (error) => {
          this.snackBar.open("Error uploading file.", "Close", {
            duration: 3000,
          });
          console.error("Error uploading file:", error);
        },
      });
    }
  }

  onMoveFile(file: FileNode, newFolderId: string) {
    this.fileManagerService.moveFile(file.id, newFolderId).subscribe({
      next: (response) => {
        this.getData();
        this.getFiles(this.folderId)
        this.snackBar.open("File moved successfully!", "Close", {
          duration: 3000,
        });
      },
      error: (error) => {
        this.snackBar.open("Error moving file.", "Close", {
          duration: 3000,
        });
      },
    });
  }

  onCopyFile(file: FileNode, newFolderId: string) {
    let newFile = this.data.find((item: FileNode) => item.id === file.id);
    if (newFile) {
      this.fileManagerService.copyFile(newFile, newFolderId).subscribe({
        next: (response) => {
          this.getData();
          this.getFiles(this.folderId)
          this.snackBar.open("File copied successfully!", "Close", {
            duration: 3000,
          });
        },
        error: (error) => {
          this.snackBar.open("Error copying file.", "Close", {
            duration: 3000,
          });
        },
      });
    } else {
      this.snackBar.open("File not found.", "Close", {
        duration: 3000,
      });
    }
  }

  generateUniqueId(): string {
    return `File${Math.random().toString(36).substr(2, 9)}`;
  }

  onAddTags(folder: FileNode, tags: string[]): void {
    this.fileManagerService.addTags(folder.id, tags).subscribe({
      next: () => {
        this.snackBar.open("Tags updated successfully!", "Close", {
          duration: 3000,
        });
        this.getData();
        this.getFiles(this.folderId)
      },
      error: (err) => {
        this.snackBar.open("Failed to update tags.", "Close", {
          duration: 3000,
        });
      },
    });
  }

  onCompressFile(file: FileNode, zipName: string) {
    this.fileManagerService.compressFile(file, zipName).subscribe({
      next: () => {
        this.snackBar.open("File compressed successfully!", "Close", {
          duration: 3000,
        });
        this.getData();
        this.getFiles(this.folderId)
      },
      error: (error) => {
        console.error('Error compressing file:', error);
        this.snackBar.open("Failed to compress file. Please try again.", "Close", {
          duration: 3000,
        });
      },
    });
  }

  onRevertFile(folder: FileNode): void {
    this.fileManagerService.revertFile(folder).subscribe({
      next: () => {
        this.snackBar.open("File reverted successfully!", "Close", {
          duration: 3000,
        });
        this.getData();
        this.getFiles(this.folderId)
      },
      error: (err) => {
        this.snackBar.open("Failed to revert file.", "Close", {
          duration: 3000,
        });
        console.error("Failed to revert file:", err);
      },
    });
  }

}