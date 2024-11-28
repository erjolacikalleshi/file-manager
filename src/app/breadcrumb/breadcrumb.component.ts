import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent {

  @Input() breadcrumbs: any[] = [];
  @Output() breadcrumbClick = new EventEmitter<any>();

  navigateTo(crumb: any) {
    this.breadcrumbClick.emit(crumb);
  }
  
}
