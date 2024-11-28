export interface FileNode {
  id: string;
  name: string;
  date: string;
  size?: number;
  parentId: string | null;
  isFolder: boolean;
  type?: string,
  content?: string,
  tags?: string[];
  children?: FileNode[];
  versions: FileVersion[];
}

export interface FileVersion {
  name: string;
  date: string;
}