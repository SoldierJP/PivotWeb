from fastapi import FastAPI, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import ExcelFile
import pandas as pd
import tempfile, os

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/files")
def list_files(db: Session = Depends(get_db)):
    files = db.query(ExcelFile).all()
    return [{"id": f.id, "filename": f.filename} for f in files]

@app.get("/files/unify")
def unify_files(ids: str, db: Session = Depends(get_db)):
    id_list = [int(i) for i in ids.split(",") if i.isdigit()]
    files = db.query(ExcelFile).filter(ExcelFile.id.in_(id_list)).all()

    dfs = [pd.read_excel(f.filepath) for f in files if os.path.exists(f.filepath)]
    if not dfs:
        return {"error": "No valid files"}

    unified = pd.concat(dfs, ignore_index=True)
    tmpfile = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    unified.to_excel(tmpfile.name, index=False)

    return FileResponse(tmpfile.name, filename="unified.xlsx")
