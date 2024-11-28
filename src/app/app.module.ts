import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTreeModule } from '@angular/material/tree';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { FolderTreeComponent } from './file-manager/folder-tree/folder-tree.component';
import { FileListComponent } from './file-manager/file-list/file-list.component';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HttpClientModule } from '@angular/common/http';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { ModalsComponent } from './modals/modals.component';
import { MatInputModule } from '@angular/material/input';
import { FileManagerComponent } from './file-manager/file-manager.component';
import { LoginComponent } from './auth/login/login.component';
import { MatCardModule } from '@angular/material/card'; 
import { ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FilePreviewComponent } from './file-manager/file-preview/file-preview.component';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CdkContextMenuTrigger, CdkMenuItem, CdkMenu } from '@angular/cdk/menu';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { NotAuthorizedComponent } from './auth/not-authorized/not-authorized.component';
import { RegisterComponent } from './auth/register/register.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { fileReducer } from './store/file.reducer';
import { FileEffects } from './store/file.effects';

@NgModule({
  declarations: [
    AppComponent,
    FolderTreeComponent,
    FileListComponent,
    ModalsComponent,
    FileManagerComponent,
    LoginComponent,
    FilePreviewComponent,
    NotAuthorizedComponent,
    RegisterComponent,
    BreadcrumbComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatTreeModule,
    MatTableModule,
    MatDialogModule,
    MatSidenavModule,
    HttpClientModule ,
    MatListModule,
    MatMenuModule,
    FormsModule,
    MatRadioModule,
    MatInputModule,
    MatCardModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSortModule,
    DragDropModule,
    MatTooltipModule,
    MatSlideToggleModule,
    CdkContextMenuTrigger, 
    CdkMenuItem, 
    CdkMenu,
    PdfViewerModule,
    MatChipsModule,
    MatFormFieldModule,
    StoreModule.forRoot({file: fileReducer}, {}),
    EffectsModule.forRoot([FileEffects])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
