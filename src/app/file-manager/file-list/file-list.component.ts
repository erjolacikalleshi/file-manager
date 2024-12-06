import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FileNode } from '../../models/file-node.model';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { FilePreviewComponent } from '../file-preview/file-preview.component';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatMenuTrigger } from '@angular/material/menu';


@Component({
  selector: 'app-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent {

  @Input() files: FileNode[] = [];
  displayedColumns: string[] = ['select', 'icon', 'name', 'date', 'size', 'tags', 'actions'];
  selection = new SelectionModel<FileNode>(true, []);
  searchQuery: string = '';
  searchTags: string = '';
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<FileNode>();
  selectedFileType: string[] = [];
  @ViewChild(MatMenuTrigger) contextMenu!: MatMenuTrigger;
  @Output() actionTriggered = new EventEmitter<{ action: string, data: FileNode }>();
  contextMenuPosition = { x: '0px', y: '0px' };
  selectedRows = [];
  role: string | null = null;
  uniqueFileTypes: string[] = [];
  showMsg: boolean = true;

  constructor(private dialog: MatDialog,
  ) {
  }

  ngOnInit() {
    this.role = sessionStorage.getItem('role')
  }

  onContextMenu(event: MouseEvent, item: FileNode) {
    event.preventDefault();
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: item };
    this.contextMenu.menu?.focusFirstItem('mouse');
    this.contextMenu.openMenu();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['files'] && changes['files'].currentValue) {
      changes['files'].firstChange ? this.showMsg = true : this.showMsg = false;
      this.dataSource.data = [...this.files];
      this.uniqueFileTypes = [...new Set(this.files.map(file => file.type).filter((type): type is string => type !== undefined))];
    }
  }

  ngAfterViewInit() {
    // Attach MatSort to the data source
    this.dataSource.sort = this.sort;
  }

  announceSortChange(event: Sort) {
    const { active, direction } = event;

    if (!direction) {
      this.dataSource.data = this.files;
      return;
    }

    // Custom sort logic
    const sortedData = [...this.files].sort((a, b) => {
      const valueA = a[active as keyof FileNode];
      const valueB = b[active as keyof FileNode];

      let comparison = 0;
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else if (typeof valueA === 'number' && typeof valueB === 'number') {
        comparison = valueA - valueB;
      } else if (active === 'date') {
        comparison = new Date(valueA as string).getTime() - new Date(valueB as string).getTime();
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    this.dataSource.data = sortedData;
  }

  getIcon(file: FileNode): string {
    return file.isFolder ? 'folder' : 'insert_drive_file';
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.files.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.files.forEach(row => this.selection.select(row));
  }

  applyFilter(): void {
    const filterQuery = this.searchQuery.trim().toLowerCase();
    const filterTags = this.searchTags.toLowerCase();
    const removeFileExtension = (filename: string) => filename.replace(/\.[^/.]+$/, '').toLowerCase();

    // Filter files by name and tags at the same time
    this.dataSource.data = this.files.filter(file => 
      (removeFileExtension(file.name).includes(filterQuery)) &&
      (file.tags?.some(tag => tag.toLowerCase().includes(filterTags)) || !filterTags)
    );
  }

  applyAdvancedFilter() {
    const filterValue = this.selectedFileType || [];

    if (filterValue.length === 0) {
      this.dataSource.data = this.files;
      return;
    }

    this.dataSource.data = this.files.filter(file => {
      const fileType = file.type || '';
      return filterValue.includes(fileType);
    });
  
    // Define MIME type categories
    // const mimeTypeCategories = {
    //   image: ['image/jpeg', 'image/png', 'image/gif'],
    //   document: ['application/pdf', 'text/plain', 'application/msword', 'application/zip']
    // };
  
    // const mimeTypesToFilter: string[] = filterValue.reduce((acc: string[], type) => {
    //   if (mimeTypeCategories[type as keyof typeof mimeTypeCategories]) {
    //     acc = acc.concat(mimeTypeCategories[type as keyof typeof mimeTypeCategories]);
    //   }
    //   return acc;
    // }, []);

    // this.dataSource.data = this.files.filter(file => {
    //   const fileType = file.type || '';
    //   return mimeTypesToFilter.length > 0 ? mimeTypesToFilter.includes(fileType) : true;
    // });
  }

  deleteRows() {
    let selectedRows = this.selection.selected.map((obj: any) => obj.id);
    this.setAction('delete', selectedRows);
    this.selection.clear();
  }

  setAction(action: string, folder: any): void {
    if (action === 'create') {
      this.actionTriggered.emit({ action: 'create', data: folder });
    }
    else if (action === 'rename') {
      this.actionTriggered.emit({ action: 'rename', data: folder }); 
    }
    else if (action === 'delete') {
      this.actionTriggered.emit({ action: 'delete', data: folder });
    }
    else if (action === 'upload') {
      this.actionTriggered.emit({ action: 'upload', data: folder });
    }
    else if (action === 'move') {
      this.actionTriggered.emit({ action: 'move', data: folder });
    }
    else if (action === 'copy') {
      this.actionTriggered.emit({ action: 'copy', data: folder });
    } 
    else if (action === "revert") {
      this.actionTriggered.emit({ action: "revert", data: folder });
    }
    else if (action === 'tags') {
      this.actionTriggered.emit({ action: 'tags', data: folder });
    }
    else if (action === 'compress') {
      this.actionTriggered.emit({ action: 'compress', data: folder });
    }
  }

  previewFile(file: FileNode) {
    if (!file || typeof file !== 'object') {
      console.error('Invalid file data');
      return;
    }

    const dialogRef = this.dialog.open(FilePreviewComponent, {
      width: '1000px',
      data: {
        file: { ...file }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (this.selection.isSelected(file)) {
        this.selection.deselect(file);
      }
    });
  }

  downloadZipFile(fileNode: FileNode): void {
    if (!fileNode.content) {
      console.error('File content is undefined');
      return;
    }
    const byteCharacters = atob(fileNode.content.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/zip' });
  
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileNode.name;
    a.click();
    window.URL.revokeObjectURL(url);
  }

}
