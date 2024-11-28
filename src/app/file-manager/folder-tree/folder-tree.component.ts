import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { FileNode, FileVersion } from '../../models/file-node.model';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

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

  @Output() folderOpened = new EventEmitter<any>();
  selectedNode: any = null;
  @Input() data: any = [];
  @Output() actionTriggered = new EventEmitter<{ action: string, data: any }>();
  breadcrumbs: any[] = [];
  nodeMap: Map<string, any> = new Map();
  expansionModel = new SelectionModel<string>(true);
  dragging = false;
  expandTimeout: any;
  expandDelay = 1000;
  role: any;
  highlightedNode: any = null;

  constructor(private snackBar: MatSnackBar) {
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

  onNodeSelect(node: any): void {
    this.selectedNode = node;
    this.folderOpened.emit(this.selectedNode.id);
    this.breadcrumbs = this.constructBreadcrumb(this.selectedNode);
  }

  //map all nodes by their id
  mapNodes(nodes: any[]) {
    nodes.forEach((node) => {
      this.nodeMap.set(node.id, node);
      if (node.children) {
        this.mapNodes(node.children);
      }
    });
  }

  constructBreadcrumb(node: any): any[] {
    const breadcrumb = [];

    let currentNode = this.nodeMap.get(node.id);

    while (currentNode) {
      if (!currentNode) break;
      breadcrumb.unshift(currentNode);

      currentNode = this.nodeMap.get(currentNode.parentId);
    }

    return breadcrumb;
  }

  onBreadcrumbClick(crumb: any) {
    this.breadcrumbs = this.constructBreadcrumb(crumb);
    this.onNodeSelect(crumb)
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
  }

  //constructs an array of nodes that matches the DOM
  visibleNodes(): FileNode[] {
    const result: FileNode[] = [];

    const addExpandedChildren = (node: FileNode, expanded: string[]) => {
      result.push(node);
      if (expanded.includes(node.id)) {
        node.children?.forEach((child) => addExpandedChildren(child, expanded));
      }
    };

    this.dataSource.data.forEach((node) => addExpandedChildren(node, this.expansionModel.selected));
    return result;
  }

  //rearrange the data based on the drop event then rebuild the tree
  drop(event: CdkDragDrop<FileNode[]>): void {
    if (!event.isPointerOverContainer) return;

    const visibleNodes = this.visibleNodes();
    const changedData = JSON.parse(JSON.stringify(this.dataSource.data)) as FileNode[];

    const findNodeAndSiblings = (
      arr: FileNode[],
      id: string
    ): { siblings: FileNode[] | null; node: FileNode | null } => {
      for (const item of arr) {
        if (item.id === id) {
          return { siblings: arr, node: item };
        } else if (item.children) {
          const result = findNodeAndSiblings(item.children, id);
          if (result.node) return result;
        }
      }
      return { siblings: null, node: null };
    };

    const nodeAtDest = visibleNodes[event.currentIndex];
    
    this.highlightedNode = nodeAtDest;

    const { siblings: newSiblings, node: targetNode } = findNodeAndSiblings(changedData, nodeAtDest.id);
    if (!newSiblings || !targetNode) return;

    const insertIndex = newSiblings.findIndex((s) => s.id === nodeAtDest.id);

    const node = event.item.data;
    const { siblings, node: nodeToMove } = findNodeAndSiblings(changedData, node.id);

    if (!siblings || !nodeToMove) return;

    const nodeAtDestFlatNode = this.treeControl.dataNodes.find((n) => nodeAtDest.id === n.id);

    // if (
    //   !targetNode.isFolder 
      
    // ) {
    //   alert('Invalid move: Check level, folder destination, and move hierarchy.');
    //   return;
    // }

    const siblingIndex = siblings.findIndex((n) => n.id === node.id);
    const removedNode = siblings.splice(siblingIndex, 1)[0];
    removedNode.parentId = targetNode.id;

    newSiblings.splice(insertIndex, 0, removedNode);

    this.highlightedNode = null;
    this.rebuildTreeForData(changedData);
  }

  dragStart() {
    this.dragging = true;
  }

  dragEnd() {
    this.dragging = false;
  }

  dragHover(node: ExampleFlatNode) {
    if (this.dragging) {
      clearTimeout(this.expandTimeout);
      this.expandTimeout = setTimeout(() => {
        this.treeControl.expand(node);
      }, this.expandDelay);
    }
  }

  dragHoverEnd() {
    if (this.dragging) {
      clearTimeout(this.expandTimeout);
    }
  }

  //for persist the tree expand state after being rebuilt
  rebuildTreeForData(data: any) {
    this.dataSource.data = data;

    this.expansionModel.selected.forEach((id) => {
      const node = this.treeControl.dataNodes.find((n) => n.id === id);

      if (node) {
        this.treeControl.expand(node);
      } else {
        console.log(`Node with id ${id} not found.`);
      }
    });
  }

}