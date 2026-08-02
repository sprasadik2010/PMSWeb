# create_admin_hash_fixed.py
import sqlite3
from datetime import datetime
from passlib.context import CryptContext

# Create password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Connect to database
conn = sqlite3.connect('pms_lite.db')
cursor = conn.cursor()

# Use a shorter password that works with bcrypt
plain_password = "admin123"  # This should work (8 chars)
# Or even shorter: "admin"

# Hash the password
try:
    hashed_password = pwd_context.hash(plain_password)
    print(f"Plain password: {plain_password}")
    print(f"Hashed password: {hashed_password}")
except ValueError as e:
    print(f"Error: {e}")
    # Try truncating if too long
    plain_password = plain_password[:72]
    hashed_password = pwd_context.hash(plain_password)

# Delete existing admin
cursor.execute("DELETE FROM users WHERE username = 'admin'")

# Insert admin user with hashed password
cursor.execute('''
    INSERT INTO users (username, password, full_name, role, is_active, created_at) 
    VALUES (?, ?, ?, ?, ?, ?)
''', ('admin', hashed_password, 'System Administrator', 'admin', 1, datetime.utcnow()))

conn.commit()

# Verify
cursor.execute("SELECT id, username, password FROM users WHERE username = 'admin'")
user = cursor.fetchone()
print(f"\n✅ Admin user created!")
print(f"ID: {user[0]}")
print(f"Username: {user[1]}")
print(f"Password hash (first 50 chars): {user[2][:50]}...")

conn.close()