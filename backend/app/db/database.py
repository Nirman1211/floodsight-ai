import os
import sqlite3
import hashlib
import uuid
import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "floodsight.db"

def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
    if not salt:
        salt = uuid.uuid4().hex
    # PBKDF2 HMAC SHA256 with 100,000 iterations for secure password hashing
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return key.hex(), salt

def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    key, _ = hash_password(password, salt)
    return key == stored_hash

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'rescuer',
        avatar_url TEXT,
        created_at TEXT NOT NULL,
        last_login TEXT
    )
    """)
    
    # 2. Activity logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_activity_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)
    
    conn.commit()
    
    # Check if a default admin/commander exists; if not, create one
    cursor.execute("SELECT id FROM users WHERE email = ?", ("commander@floodsight.org",))
    if not cursor.fetchone():
        pwd_hash, salt = hash_password("Rescue2026!")
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        cursor.execute("""
        INSERT INTO users (id, email, name, password_hash, salt, role, avatar_url, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "usr_commander_01",
            "commander@floodsight.org",
            "Tactical Incident Commander",
            pwd_hash,
            salt,
            "commander",
            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            now,
            now
        ))
        conn.commit()
    
    conn.close()

def create_user(email: str, name: str, password: str, role: str = "rescuer", avatar_url: Optional[str] = None) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    email = email.strip().lower()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise ValueError("An account with this email address already exists in the database.")
    
    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    pwd_hash, salt = hash_password(password)
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    if not avatar_url:
        avatar_url = f"https://api.dicebear.com/7.x/bottts/svg?seed={email}"
        
    cursor.execute("""
    INSERT INTO users (id, email, name, password_hash, salt, role, avatar_url, created_at, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, email, name.strip(), pwd_hash, salt, role, avatar_url, now, now))
    
    conn.commit()
    conn.close()
    
    return {
        "id": user_id,
        "email": email,
        "name": name.strip(),
        "role": role,
        "avatar_url": avatar_url,
        "created_at": now
    }

def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    
    email = email.strip().lower()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        return None
        
    if not verify_password(password, user["password_hash"], user["salt"]):
        conn.close()
        return None
        
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute("UPDATE users SET last_login = ? WHERE id = ?", (now, user["id"]))
    conn.commit()
    conn.close()
    
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "avatar_url": user["avatar_url"],
        "last_login": now
    }

def authenticate_google_user(email: str, name: str, picture: Optional[str] = None, role: str = "analyst") -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    email = email.strip().lower()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if user:
        cursor.execute("UPDATE users SET last_login = ?, avatar_url = COALESCE(?, avatar_url) WHERE id = ?", 
                       (now, picture, user["id"]))
        conn.commit()
        user_id = user["id"]
        role = user["role"]
        name = user["name"]
        avatar = picture or user["avatar_url"]
    else:
        user_id = f"usr_g_{uuid.uuid4().hex[:10]}"
        pwd_hash, salt = hash_password(uuid.uuid4().hex)
        avatar = picture or f"https://api.dicebear.com/7.x/bottts/svg?seed={email}"
        cursor.execute("""
        INSERT INTO users (id, email, name, password_hash, salt, role, avatar_url, created_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, email, name, pwd_hash, salt, role, avatar, now, now))
        conn.commit()
        
    conn.close()
    return {
        "id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "avatar_url": avatar,
        "last_login": now
    }

def list_users() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, email, name, role, avatar_url, created_at, last_login FROM users ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]
