from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib import messages

# Create your views here.
def signup(request):
    """Handle user registration with form-based submission"""
    if request.method == "POST":
        # Get form data from POST request
        first_name = request.POST.get("first_name", "").strip()
        last_name = request.POST.get("last_name", "").strip()
        username = request.POST.get("username", "").strip()
        email = request.POST.get("email", "").strip()
        password = request.POST.get("password", "")
        password_confirm = request.POST.get("password_confirm", "")
        
        # Validation checks
        errors = []
        
        # Check if all fields are provided
        if not all([first_name, last_name, username, email, password, password_confirm]):
            errors.append("All fields are required!")
        
        # Check if username already exists
        if User.objects.filter(username=username).exists():
            errors.append("Username already taken!")
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            errors.append("Email already registered!")
        
        # Check if passwords match
        if password != password_confirm:
            errors.append("Passwords don't match!")
        
        # Check password length
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long!")
        
        # If there are errors, show them
        if errors:
            for error in errors:
                messages.error(request, error)
            return render(request, "signup.html")
        
        # Create user if all validations pass
        try:
            my_user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            my_user.save()
            messages.success(request, "Account created successfully! Please login.")
            return redirect("login_view")
        except Exception as e:
            messages.error(request, f"Error creating account: {str(e)}")
            return render(request, "signup.html")
    
    return render(request, "signup.html")


def login_view(request):
    """Handle user login with form-based submission"""
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")
        
        # Authenticate user
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, f"Welcome back, {user.first_name}!")
            return redirect("home")  # Redirect to home or dashboard
        else:
            messages.error(request, "Invalid username or password!")
            return render(request, "loginn.html")
    
    return render(request, "loginn.html")
