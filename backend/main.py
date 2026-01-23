from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

app = FastAPI(tittle = "Screwceus", description = "Learning the basics", version = "0.1.0")

app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_HOSTS, allow_credentials=True, allow_methods=["*"],
        allow_headers=["*"],
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)