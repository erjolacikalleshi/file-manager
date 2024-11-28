import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  loginForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }
  
    const { username, password } = this.loginForm.value;

    this.authService.getUsers().subscribe({
      next: (users) => {
      const user = users.find(u => u.username === username && u.password === password);

        if (user) {
          sessionStorage.setItem('role', user.role);
          this.snackBar.open('Login Successful!','Close',{duration:1000})
          this.router.navigate(['/file-manager']); // Redirect after login
        } else {
          this.snackBar.open('Invalid credentials.','Close',{duration:1000})
        }
      },
      error: () => {
        this.loginForm.setErrors({ unauthenticated: true });
      }
    });
  }

}
