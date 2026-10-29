"""
Administrative account creation CLI tool for Bean Theory.
Use in production or staging to safely initialize or reset an administrator account.

Usage:
    python backend/scripts/create_admin.py --email admin@beantheory.com.np --password "YourStrongPassword#2026"
Or set environment variables:
    ADMIN_EMAIL=admin@beantheory.com.np ADMIN_PASSWORD=... python backend/scripts/create_admin.py
"""
import sys
import os
import argparse
import getpass

# Add backend directory to path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app import create_app
from app.extensions import db
from app.models import User


def create_or_update_admin(email, password, first_name='Bean Theory', last_name='Admin'):
    if not email or '@' not in email:
        raise ValueError("A valid email address is required.")
    if not password or len(password) < 12:
        raise ValueError("Password must be at least 12 characters long.")

    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email.strip().lower()).first()
        if user:
            print(f"Existing user found for {email}. Updating to administrator role and resetting password...")
            user.set_password(password)
            user.is_admin = True
            db.session.commit()
            print(f"Administrator {email} successfully updated.")
        else:
            print(f"Creating new administrator account for {email}...")
            user = User(
                email=email.strip().lower(),
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                is_admin=True
            )
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            print(f"Administrator {email} successfully created.")


def main():
    parser = argparse.ArgumentParser(description="Create or update an administrator account.")
    parser.add_argument("--email", default=os.environ.get("ADMIN_EMAIL"), help="Admin email address")
    parser.add_argument("--password", default=os.environ.get("ADMIN_PASSWORD"), help="Admin password")
    parser.add_argument("--first-name", default="Bean Theory", help="Admin first name")
    parser.add_argument("--last-name", default="Admin", help="Admin last name")
    args = parser.parse_args()

    email = args.email
    password = args.password

    if not email:
        email = input("Enter administrator email: ").strip()

    if not password:
        password = getpass.getpass("Enter administrator password (min 12 chars): ")
        confirm = getpass.getpass("Confirm administrator password: ")
        if password != confirm:
            print("Error: Passwords do not match.")
            sys.exit(1)

    try:
        create_or_update_admin(email, password, args.first_name, args.last_name)
    except Exception as e:
        print(f"Failed to create administrator: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
