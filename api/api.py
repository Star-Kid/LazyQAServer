import asyncio
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import (Boolean, Column, ForeignKey, Integer, String, create_engine, select, BigInteger)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, relationship, sessionmaker, selectinload
from pydantic import BaseModel, Field, ConfigDict

# DB Config
DATABASE_URL = "postgresql+asyncpg://postgres:example@localhost:5433/hackaton"

# --- SQLAlchemy ORM Setup ---
Base = declarative_base()
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionFactory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# --- Lifespan Event Handler ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Uncomment to reset DB
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created.")
    yield
    # Code to run on shutdown (if any)
    print("Shutting down.")


# --- FastAPI Application ---
app = FastAPI(
    title="AI Test API",
    description="An API to manage projects and their associated test cases.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to explicit origins for production if needed
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a database session
async def get_db():
    async with AsyncSessionFactory() as session:
        yield session

# ORM Models
class Project(Base):
    __tablename__ = "project"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String)
    prompt = Column(String)
    steps = Column(ARRAY(Integer))
    curstep = Column(Integer)

    test_cases = relationship("TestCase", back_populates="project", cascade="all, delete-orphan")

class TestCase(Base):
    __tablename__ = "test_case"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String)
    project_id = Column(BigInteger, ForeignKey("project.id"), nullable=False)
    prompt = Column(String)
    warnings = Column(ARRAY(String))
    errors = Column(ARRAY(String))
    is_running = Column(Boolean, default=False)
    is_done = Column(Boolean, default=False)
    step = Column(Integer)
    cur_prompt = Column(String)
    
    project = relationship("Project", back_populates="test_cases")

# JSON Models
class TestCaseBase(BaseModel):
    name: str

class TestCaseCreate(TestCaseBase):
    prompt: str

class TestCaseListEntry(TestCaseBase):
    id: int

class TestCaseList(BaseModel):
    testcases: List[TestCaseListEntry] = Field(default_factory=list)

class TestCaseSchema(TestCaseBase):
    id: int
    prompt: str
    project_id: int
    warnings: List[str]
    errors: List[str]
    is_running: bool
    is_done: bool
    step: int
    cur_prompt: str

    model_config = ConfigDict(from_attributes=True)

class ProjectBase(BaseModel):
    name: str
    
class ProjectCreate(ProjectBase):
    prompt: str

class ProjectListEntry(ProjectBase):
    id: int

class ProjectList(BaseModel):
    projects: List[ProjectListEntry] = Field(default_factory=list)

class ProjectSchema(ProjectBase):
    id: int
    prompt: str
    steps: List[int] = Field(default_factory=list)
    curstep: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# API Paths
@app.get("/")
async def root():
    return {"message": "Hey buddy I think you got the wrong door"}

@app.get("/api/projects", response_model=ProjectList)
async def list_projects(db: AsyncSession = Depends(get_db)):
    stmt = select(Project.id, Project.name).order_by(Project.id)
    result = await db.execute(stmt)
    result_rows = result.all()
    print(result_rows)
    project_entries = [ProjectListEntry(id=proj.id, name=proj.name) for proj in result_rows]
    project_list = ProjectList(projects=project_entries)
    return project_list

@app.post("/api/projects", status_code=201)
async def create_project(project: ProjectCreate, db: AsyncSession = Depends(get_db)):
    db_project = Project(**project.dict())
    db_project.steps = []
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return {"status": "ok"}

@app.get("/api/projects/{project_id}", response_model=ProjectSchema)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: int, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
    return {"status": "ok"}

@app.get("/api/projects/{project_id}/testcases", response_model=TestCaseList)
async def list_testcases(project_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(TestCase.id, TestCase.name)\
        .where(TestCase.project_id == project_id)\
        .order_by(TestCase.id)
    result = await db.execute(stmt)
    result_rows = result.all()
    print(result_rows)
    testcase_entries = [TestCaseListEntry(id=row.id, name=row.name) for row in result_rows]
    testcase_list = TestCaseList(testcases=testcase_entries)
    return testcase_list

@app.post("/api/projects/{project_id}/testcases", status_code=201)
async def create_testcase(project_id: int, testcase: TestCaseCreate, db: AsyncSession = Depends(get_db)):
    db_testcase = TestCase(**testcase.dict())
    db_testcase.project_id = project_id
    db_testcase.warnings = []
    db_testcase.errors = []
    db_testcase.step = 0
    db_testcase.cur_prompt = ""
    db.add(db_testcase)
    await db.commit()
    await db.refresh(db_testcase)
    return {"status": "ok"}

@app.get("/api/projects/{project_id}/testcases/{testcase_id}", response_model=TestCaseSchema)
async def get_testcase(project_id: int, testcase_id: int, db: AsyncSession = Depends(get_db)):
    testcase = await db.get(TestCase, testcase_id)
    if not testcase:
        raise HTTPException(status_code=404, detail="TestCase not found")
    return testcase

@app.delete("/api/projects/{project_id}/testcases/{testcase_id}")
async def delete_testcase(project_id: int, testcase_id: int, db: AsyncSession = Depends(get_db)):
    testcase = await db.get(TestCase, testcase_id)
    if not testcase:
        raise HTTPException(status_code=404, detail="TestCase not found")
    await db.delete(testcase)
    await db.commit()
    return {"status": "ok"}

# Aux Functions
