import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    public authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      role: ['user', Validators.required]
    });
  }

  get f() { return this.registerForm.controls; }

  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    
    const newUser = this.registerForm.value;

    this.authService.getUsers().subscribe((users) => {
      // Check for duplicate username
      const existingUser = users.find(
        (user) => user.username === newUser.username
      );
  
      if (existingUser) {
        this.errorMessage = 'Username already exists. Please choose another.';
        this.registerForm.get('username')?.reset();
      } else {
        // Proceed with registration if no duplicate is found
        this.authService.register(newUser).subscribe(
          () => {
            this.errorMessage = ''
            this.snackBar.open('Registration Successful!','Close',{duration:1000})
            this.registerForm.reset();
            this.router.navigate(['/login']);
          },
          (error) => {
            this.registerForm.setErrors({ unauthenticated: true });
            this.snackBar.open('Registration failed!','Close',{duration:1000})
          }
        );
      }
    });
  }

  
  
}
