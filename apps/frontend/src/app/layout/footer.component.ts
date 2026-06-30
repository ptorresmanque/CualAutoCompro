import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DisclaimerComponent } from '../shared/ui/disclaimer.component';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, DisclaimerComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {}