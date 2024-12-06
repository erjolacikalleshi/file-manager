import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { FileNode, FileVersion } from '../../models/file-node.model';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

interface ExampleFlatNode {
  expandable: boolean;
  id: string;
  name: string;
  level: number;
  isFolder: boolean,
  parentId: string | null;
  versions: FileVersion[];
}

@Component({
  selector: 'app-folder-tree',
  templateUrl: './folder-tree.component.html',
  styleUrls: ['./folder-tree.component.scss']
})
export class FolderTreeComponent {

  @Output() folderOpened = new EventEmitter<string>();
  selectedNode: ExampleFlatNode | null = null;
  @Input() data: FileNode[] = [];
  @Output() actionTriggered = new EventEmitter<{ action: string, data: FileNode | null }>();
  breadcrumbs: any[] = [];
  nodeMap: Map<string, FileNode> = new Map();
  role: string | null = null;

  constructor() {
  }

  ngOnInit() {
    this.role = sessionStorage.getItem('role')
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["data"] && changes["data"].currentValue) {
      const treeData = this.buildTree(this.data);
      this.nodeMap = new Map();
      this.mapNodes(treeData);
      this.dataSource.data = treeData;
    }

    if (changes["data"] || changes["nodeMap"]) {
      if(this.breadcrumbs.length > 0) this.breadcrumbs = this.constructBreadcrumb(this.selectedNode);
    }
  }

  // helper method to transform the data from db.json as nodes for tree
  buildTree(data: FileNode[], parentId: string | null = null): FileNode[] {
    return data
      .filter((item) => item.parentId === parentId) 
      .map((node) => ({
        ...node,
        children: this.buildTree(data, node.id),
        expandable: data.some((child) => child.parentId === node.id)
      }));
  }

  private _transformer = (node: FileNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      id: node.id,
      name: node.name,
      level: level,
      isFolder: node.isFolder,
      parentId: node.parentId || null,
      versions: node.versions
    };
  };

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  hasChild = (_: number, node: ExampleFlatNode) => node.expandable;

  onNodeSelect(node: ExampleFlatNode): void {
    this.selectedNode = node;
    this.folderOpened.emit(this.selectedNode?.id);
    this.breadcrumbs = this.constructBreadcrumb(this.selectedNode);
  }

  //map all nodes by their id
  mapNodes(nodes: FileNode[]) {
    nodes.forEach((node) => {
      this.nodeMap.set(node.id, node);
      if (node.children) {
        this.mapNodes(node.children);
      }
    });
  }

  constructBreadcrumb(node: ExampleFlatNode | null): FileNode[] {
    const breadcrumb = [];

    let currentNode = node ? this.nodeMap.get(node.id) : null;

    while (currentNode) {
      if (!currentNode) break;
      breadcrumb.unshift(currentNode);

      currentNode = currentNode.parentId ? this.nodeMap.get(currentNode.parentId) : null;
    }

    return breadcrumb;
  }

  onBreadcrumbClick(crumb: any) {
    this.breadcrumbs = this.constructBreadcrumb(crumb);
    this.onNodeSelect(crumb)
  }

  setAction(action: string, folder: FileNode | null): void {
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
  }

}