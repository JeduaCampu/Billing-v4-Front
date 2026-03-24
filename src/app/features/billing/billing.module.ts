import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // <-- IMPORTANTE

import { BillingRoutingModule } from './billing-routing.module';
import { BillingListComponent } from './pages/billing-list/billing-list.component';
import { BillingCreateComponent } from './pages/billing-create/billing-create.component';

@NgModule({
  declarations: [
    BillingListComponent,
    BillingCreateComponent
  ],
  imports: [
    CommonModule,
    BillingRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class BillingModule { }