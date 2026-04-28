import os
import sys
from fastapi import FastAPI, HTTPException
import uvicorn

# Add current directory to sys.path to resolve 'src' module when running from different locations
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src import api_router
from src.response import CustomException, error_handler
from src.middlewares import setup_cors


app = FastAPI(title="Student Management System")
setup_cors(app)


app.add_exception_handler(CustomException, error_handler)
app.add_exception_handler(HTTPException, error_handler)

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Welcome to Student Management System"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
