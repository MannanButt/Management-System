import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

# Add src to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.models.users import Users
from src.database import DATABASE_URL
from src.auth import get_password_hash
from src.core.config import settings

async def seed_admin():
    print(f"Connecting to database...")
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if admin exists
        email = settings.ADMIN_EMAIL
        password = settings.ADMIN_PASSWORD
        
        print(f"Checking if user {email} exists...")
        result = await session.execute(select(Users).where(Users.email.ilike(email)))
        user = result.scalar_one_or_none()
        
        if user:
            print(f"Admin user {email} already exists.")
        else:
            print(f"Creating admin user {email}...")
            hashed_password = get_password_hash(password)
            new_admin = Users(
                email=email,
                password=hashed_password,
                role="admin"
            )
            session.add(new_admin)
            await session.commit()
            print(f"Admin user {email} created successfully!")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed_admin())
