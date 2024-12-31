import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoteFormComponent } from './note-form/note-form.component';
import { NoteListComponent } from './note-list/note-list.component';
import { RouterModule } from '@angular/router';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  declarations: [
    AppComponent,
    NoteFormComponent,
    NoteListComponent
  ],
  imports: [
    BrowserModule,
    FormsModule, ReactiveFormsModule,
    RouterModule.forRoot([
      { path: ':id', component: NoteFormComponent },
      { path: '', component: NoteListComponent }
    ]),
    ServiceWorkerModule.register('service-worker.js', {
      enabled: true,
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
