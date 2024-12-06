import { Injectable, NgZone } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { FileNode } from "../models/file-node.model";
import * as JSZip from "jszip";

interface PendingChange {
  id: string;
  action: "create" | "update" | "delete";
  data: Partial<FileNode> | null;
  timestamp: number;
}

@Injectable({
  providedIn: "root",
})
export class FileManagerService {
  private apiUrl = "http://localhost:3000/TREE_DATA";
  private readonly STORAGE_KEY = "fileManager_data";
  private readonly PENDING_CHANGES_KEY = "fileManager_pendingChanges";
  private readonly LOCAL_STORAGE_EVENT_KEY = "fileManager_localStorageUpdate";
  private isOnline = true;

  // Real-Time Update Subject
  private fileTreeSubject = new BehaviorSubject<FileNode[]>([]);
  private fileTreeObservable$ = this.fileTreeSubject.asObservable();

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
  ) {
    this.initializeLocalStorageListener();
    this.initializeFileTree();

    // Online/Offline event listeners
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncPendingChanges().catch((error) =>
        console.error("Error syncing pending changes:", error),
      );
    });
    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  // Initialize localStorage event listener
  private initializeLocalStorageListener(): void {
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener("storage", (event) => {
        // Check if the event is for our specific storage key
        if (event.key === this.LOCAL_STORAGE_EVENT_KEY) {
          this.ngZone.run(() => {
            // Retrieve the latest data from localStorage
            const updatedData = this.getFromStorage();
            this.fileTreeSubject.next(updatedData);
          });
        }
      });
    });
  }

  // Save data to localStorage
  private saveToStorage(data: FileNode[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

      // Trigger a custom localStorage event for cross-tab synchronization
      localStorage.setItem(
        this.LOCAL_STORAGE_EVENT_KEY,
        JSON.stringify({ timestamp: Date.now() }),
      );
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  // Retrieve data from localStorage
  private getFromStorage(): FileNode[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return [];
    }
  }

  // Save pending changes to localStorage
  private savePendingChange(change: PendingChange): void {
    try {
      const changes = this.getPendingChanges();
      changes.push(change);
      localStorage.setItem(this.PENDING_CHANGES_KEY, JSON.stringify(changes));
    } catch (error) {
      console.error("Error saving pending change:", error);
    }
  }

  // Retrieve pending changes from localStorage
  private getPendingChanges(): PendingChange[] {
    try {
      const changes = localStorage.getItem(this.PENDING_CHANGES_KEY);
      return changes ? JSON.parse(changes) : [];
    } catch (error) {
      console.error("Error reading pending changes:", error);
      return [];
    }
  }

  // Remove a specific pending change
  private removePendingChange(id: string): void {
    try {
      const changes = this.getPendingChanges().filter(
        (change) => change.id !== id,
      );
      localStorage.setItem(this.PENDING_CHANGES_KEY, JSON.stringify(changes));
    } catch (error) {
      console.error("Error removing pending change:", error);
    }
  }

  // Manually broadcast localStorage update
  broadcastLocalStorageUpdate(): void {
    const currentData = this.getFromStorage();
    this.fileTreeSubject.next(currentData);

    localStorage.setItem(
      this.LOCAL_STORAGE_EVENT_KEY,
      JSON.stringify({ timestamp: Date.now() }),
    );
  }

  // Observable for real-time file tree updates
  getFileTreeUpdates(): Observable<FileNode[]> {
    return this.fileTreeObservable$;
  }

  // Initialize file tree from storage or API
  private initializeFileTree(): void {
    const storedData = this.getFromStorage();

    if (storedData.length > 0) {
      // Use stored data immediately
      this.fileTreeSubject.next(storedData);
    }

    // Fetch fresh data from API
    this.getDataTree().subscribe({
      next: (data) => {
        // Update if different from stored data
        if (this.hasDataChanged(storedData, data)) {
          this.saveToStorage(data);
          this.fileTreeSubject.next(data);
        }
      },
      error: (err) => console.error("Failed to initialize file tree", err),
    });
  }

  // Check if data has actually changed
  private hasDataChanged(oldData: FileNode[], newData: FileNode[]): boolean {
    if (oldData.length !== newData.length) return true;

    return newData.some(
      (newItem, index) =>
        JSON.stringify(newItem) !== JSON.stringify(oldData[index]),
    );
  }

  // Sync pending changes when online
  private async syncPendingChanges(): Promise<void> {
    const pendingChanges = this.getPendingChanges();

    for (const change of pendingChanges) {
      try {
        switch (change.action) {
          case "create":
            if (change.data) {
              await this.http.post(this.apiUrl, change.data).toPromise();
            }
            break;
          case "update":
            if (change.data) {
              await this.http
                .patch(`${this.apiUrl}/${change.id}`, change.data)
                .toPromise();
            }
            break;
          case "delete":
            await this.http.delete(`${this.apiUrl}/${change.id}`).toPromise();
            break;
        }
        this.removePendingChange(change.id);
      } catch (error) {
        console.error(`Failed to sync change for ${change.id}:`, error);
      }
    }

    try {
      const freshData = await this.http
        .get<FileNode[]>(this.apiUrl)
        .toPromise();
      if (freshData) {
        this.saveToStorage(freshData);
        this.fileTreeSubject.next(freshData);
      }
    } catch (error) {
      console.error("Failed to refresh cache after sync:", error);
    }
  }

  // Get file tree data
  getDataTree(): Observable<FileNode[]> {
    if (this.isOnline) {
      return this.http.get<FileNode[]>(this.apiUrl).pipe(
        tap((data) => this.saveToStorage(data)),
        catchError(() => of(this.getFromStorage())),
      );
    }
    return of(this.getFromStorage());
  }

  // Get children of a specific folder
  getChildren(folderId: string): Observable<FileNode[]> {
    if (this.isOnline) {
      return this.http
        .get<FileNode[]>(`${this.apiUrl}?parentId=${folderId}`)
        .pipe(
          map((items) => items.filter((item) => item.parentId === folderId))
        );
    }
    const currentData = this.getFromStorage();
    const children = currentData.filter((item) => item.parentId === folderId);
    return of(children);
  }

  // Create a new folder
  createFolder(
    folderName: string,
    parentId: string | null,
  ): Observable<FileNode> {
    const newFolder: FileNode = {
      id: crypto.randomUUID(),
      name: folderName,
      parentId,
      date: new Date().toLocaleDateString(),
      isFolder: true,
      tags: [],
      versions: [],
    };

    if (this.isOnline) {
      return this.http.post<FileNode>(this.apiUrl, newFolder).pipe(
        tap((response) => {
          const currentData = this.getFromStorage();
          currentData.push(response);
          this.saveToStorage(currentData);
        }),
      );
    }

    const currentData = this.getFromStorage();
    currentData.push(newFolder);
    this.saveToStorage(currentData);

    this.savePendingChange({
      id: newFolder.id,
      action: "create",
      data: newFolder,
      timestamp: Date.now(),
    });

    return of(newFolder);
  }

  // Rename a folder/file
  renameFolder(folder: FileNode, newName: string): Observable<FileNode> {
    const fileVersion = [
      { name: folder.name, date: new Date().toISOString() },
      ...folder.versions,
    ];

    if (this.isOnline) {
      return this.http
        .patch<FileNode>(`${this.apiUrl}/${folder.id}`, {
          name: newName,
          versions: fileVersion,
        })
        .pipe(
          tap((response) => {
            const currentData = this.getFromStorage();
            const index = currentData.findIndex(
              (item) => item.id === folder.id,
            );
            if (index !== -1) {
              currentData[index] = response;
              this.saveToStorage(currentData);
            }
          }),
        );
    }

    const currentData = this.getFromStorage();
    const index = currentData.findIndex((item) => item.id === folder.id);
    if (index === -1) {
      return throwError(() => new Error("Folder not found"));
    }

    const updatedFolder = {
      ...currentData[index],
      name: newName,
      versions: fileVersion,
    };
    currentData[index] = updatedFolder;
    this.saveToStorage(currentData);

    this.savePendingChange({
      id: folder.id,
      action: "update",
      data: {
        name: newName,
        versions: fileVersion,
      },
      timestamp: Date.now(),
    });

    return of(updatedFolder);
  }

  // Add tags to a folder/file
  addTags(folderId: string, newTags: string[]): Observable<FileNode> {
    if (this.isOnline) {
      return this.http
        .patch<FileNode>(`${this.apiUrl}/${folderId}`, { tags: newTags })
        .pipe(
          tap((response) => {
            const currentData = this.getFromStorage();
            const index = currentData.findIndex((item) => item.id === folderId);
            if (index !== -1) {
              currentData[index] = { ...currentData[index], tags: newTags };
              this.saveToStorage(currentData);
            }
          }),
        );
    }

    const currentData = this.getFromStorage();
    const index = currentData.findIndex((item) => item.id === folderId);
    if (index === -1) {
      return throwError(() => new Error("Folder not found"));
    }

    const updatedFolder = { ...currentData[index], tags: newTags };
    currentData[index] = updatedFolder;
    this.saveToStorage(currentData);

    this.savePendingChange({
      id: folderId,
      action: "update",
      data: { tags: newTags },
      timestamp: Date.now(),
    });

    return of(updatedFolder);
  }

  private findChildItems(items: FileNode[], parentId: string): string[] {
    const childIds: string[] = [];

    const findChildren = (currentParentId: string) => {
      const directChildren = items
        .filter((item) => item.parentId === currentParentId)
        .map((item) => {
          childIds.push(item.id);
          findChildren(item.id);
          return item.id;
        });

      return directChildren;
    };

    findChildren(parentId);
    return childIds;
  }

  // Delete folder/file
  deleteFolder(ids: string[] | string): Observable<void> {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const currentData = this.getFromStorage();

    const itemsToDelete: string[] = [];
    idArray.forEach((parentId) => {
      const childIds = this.findChildItems(currentData, parentId);
      itemsToDelete.push(parentId, ...childIds);
    });

    if (this.isOnline) {
      return new Observable((observer) => {
        const deleteRequests = itemsToDelete.map((id) =>
          this.http.delete<void>(`${this.apiUrl}/${id}`).toPromise(),
        );

        Promise.all(deleteRequests)
          .then(() => {
            const updatedData = currentData.filter(
              (item) => !itemsToDelete.includes(item.id),
            );
            this.saveToStorage(updatedData);
            observer.next();
            observer.complete();
          })
          .catch((err) => observer.error(err));
      });
    }

    // Offline mode handling
    const updatedData = currentData.filter(
      (item) => !itemsToDelete.includes(item.id),
    );
    this.saveToStorage(updatedData);

    // Save pending changes for each item to be deleted
    itemsToDelete.forEach((id) => {
      this.savePendingChange({
        id,
        action: "delete",
        data: null,
        timestamp: Date.now(),
      });
    });

    return of(void 0);
  }

  // Upload a file
  uploadFile(fileData: FileNode): Observable<FileNode> {
    if (this.isOnline) {
      return this.http.post<FileNode>(this.apiUrl, fileData).pipe(
        tap((response) => {
          const currentData = this.getFromStorage();
          currentData.push(response);
          this.saveToStorage(currentData);
        }),
      );
    }

    const currentData = this.getFromStorage();
    currentData.push(fileData);
    this.saveToStorage(currentData);

    this.savePendingChange({
      id: fileData.id,
      action: "create",
      data: fileData,
      timestamp: Date.now(),
    });

    return of(fileData);
  }

  //move file to another node
  moveFile(fileId: string, newParentId: string): Observable<FileNode> {
    if (this.isOnline) {
      return this.http
        .patch<FileNode>(`${this.apiUrl}/${fileId}`, { parentId: newParentId })
        .pipe(
          tap((response) => {
            const currentData = this.getFromStorage();
            const index = currentData.findIndex((item) => item.id === fileId);
            if (index !== -1) {
              currentData[index] = {
                ...currentData[index],
                parentId: newParentId,
              };
              this.saveToStorage(currentData);
            }
          }),
        );
    }

    const currentData = this.getFromStorage();
    const index = currentData.findIndex((item) => item.id === fileId);

    if (index === -1) {
      return throwError(() => new Error("File not found"));
    }

    const updatedFile = { ...currentData[index], parentId: newParentId };
    currentData[index] = updatedFile;
    this.saveToStorage(currentData);

    this.savePendingChange({
      id: fileId,
      action: "update",
      data: { parentId: newParentId },
      timestamp: Date.now(),
    });

    return of(updatedFile);
  }
  
  // copy file to another node
  copyFile(sourceFile: FileNode, newParentId: string): Observable<FileNode> {
    const newFile: FileNode = {
      ...sourceFile,
      id: crypto.randomUUID(),
      parentId: newParentId,
      date: new Date().toLocaleDateString(),
    };

    if (this.isOnline) {
      return this.http.post<FileNode>(this.apiUrl, newFile).pipe(
        tap((response) => {
          const currentData = this.getFromStorage();
          currentData.push(response);
          this.saveToStorage(currentData);
        }),
      );
    }

    const currentData = this.getFromStorage();
    currentData.push(newFile);
    this.saveToStorage(currentData);

    this.savePendingChange({
      id: newFile.id,
      action: "create",
      data: newFile,
      timestamp: Date.now(),
    });

    return of(newFile);
  }

  // revert file to previous versions
  revertFile(file: FileNode): Observable<FileNode> {
    if (!file?.versions?.length)
      return throwError(() => new Error("Versions not found"));

    const [lastversion, ...oldVersions] = file.versions;

    if (this.isOnline) {
      return this.http
        .patch<FileNode>(`${this.apiUrl}/${file.id}`, {
          name: lastversion.name,
          versions: oldVersions,
        })
        .pipe(
          tap((response) => {
            const currentData = this.getFromStorage();
            const index = currentData.findIndex((item) => item.id === file.id);
            if (index !== -1) {
              currentData[index] = response;
              this.saveToStorage(currentData);
            }
          }),
        );
    }

    const currentData = this.getFromStorage();
    const index = currentData.findIndex((item) => item.id === file.id);
    if (index === -1) {
      return throwError(() => new Error("File not found"));
    }

    const updatedFile = {
      ...currentData[index],
      name: lastversion.name,
      versions: oldVersions,
    };
    currentData[index] = updatedFile;
    this.saveToStorage(currentData);

    this.savePendingChange({
      id: file.id,
      action: "update",
      data: {
        name: lastversion.name,
        versions: oldVersions,
      },
      timestamp: Date.now(),
    });

    return of(updatedFile);
  }

  //add file to zip
  compressFile(originalFile: any, zipName: string): Observable<any> {
    const zip = new JSZip();

    zip.file(originalFile.name, originalFile.content);

    return new Observable((observer) => {
      zip
        .generateAsync({ type: "blob" })
        .then(async (blob) => {
          try {
            // Convert blob to Base64
            const base64Content = await this.convertBlobToBase64(blob);

            // compressed file object
            const compressedFile = {
              id: `${originalFile.id}-zip`,
              name: `${zipName}.zip`,
              parentId: originalFile.parentId,
              date: new Date().toLocaleDateString(),
              size: this.calculateCompressedSize(blob.size),
              isFolder: false,
              type: "application/zip",
              content: base64Content
            };

            this.http.post(this.apiUrl, compressedFile).subscribe({
              next: (response) => {
                observer.next(response);
                observer.complete();
              },
              error: (error) => {
                observer.error(error);
              },
            });
          } catch (error) {
            observer.error(error);
          }
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  private calculateCompressedSize(size: number): string {
    return (size / 1024).toFixed(2);
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}