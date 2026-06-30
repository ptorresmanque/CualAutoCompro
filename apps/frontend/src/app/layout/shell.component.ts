import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './footer.component';
import { TopNavBarComponent } from './top-nav-bar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, FooterComponent, TopNavBarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {}
