from sqlmodel import SQLModel

from app.models.custom_part_type import CustomPartType
from app.models.folder import Folder
from app.models.part import Part
from app.models.photo import Photo
from app.models.project_file import ProjectFile
from app.models.project_part import ProjectPart
from app.models.project_screenshot import ProjectScreenshot
from app.models.user import User

metadata = SQLModel.metadata
