import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface Breadcrumb {
  name: string;
  path: string;
}

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent {

  @Input() breadcrumbs: Breadcrumb[] = [];
  @Output() breadcrumbClick = new EventEmitter<Breadcrumb>();

  navigateTo(crumb: Breadcrumb) {
    this.breadcrumbClick.emit(crumb);
  }
  
}
