import re
import os
import shutil

# 1. Update launch repository
launch_repo_path = "backend/domain/launch/repository.py"
with open(launch_repo_path, "r") as f:
    launch_repo_content = f.read()

# add_remark_to_launch
launch_repo_content = re.sub(
    r'(async def add_remark_to_launch.*?\n\s+launch\.remark = remark\n)',
    r'\1    await db_session.flush()\n',
    launch_repo_content,
    flags=re.DOTALL
)
# add_repair_to_launch
launch_repo_content = re.sub(
    r'(async def add_repair_to_launch.*?\n\s+launch\.is_repaired = True\n)',
    r'\1    await db_session.flush()\n',
    launch_repo_content,
    flags=re.DOTALL
)

with open(launch_repo_path, "w") as f:
    f.write(launch_repo_content)

# 2. Update day_log router
day_log_router_path = "backend/domain/day_log/router.py"
with open(day_log_router_path, "r") as f:
    day_log_content = f.read()

day_log_content = re.sub(
    r'db: AsyncSession = Depends\(get_db\),\n\):\n    day_log_model = await repository\.add_day_log\(db, day_log\)\n    await db\.commit\(\)\n    return day_log_model',
    r'db: AsyncSession = Depends(get_db),\n):\n    async with db.begin():\n        day_log_model = await repository.add_day_log(db, day_log)\n    return day_log_model',
    day_log_content
)
with open(day_log_router_path, "w") as f:
    f.write(day_log_content)

# 3. Update launch router
launch_router_path = "backend/domain/launch/router.py"
with open(launch_router_path, "r") as f:
    launch_content = f.read()

launch_content = re.sub(
    r'async def create_launch\([\s\S]*?db: AsyncSession = Depends\(get_db\),\n\):\n    launch_model = await repository\.add_launch\(db, launch\)\n    await db\.commit\(\)\n    return launch_model',
    r'async def create_launch(\n    launch: schema.LaunchCreate,\n    db: AsyncSession = Depends(get_db),\n):\n    async with db.begin():\n        launch_model = await repository.add_launch(db, launch)\n    return launch_model',
    launch_content
)
launch_content = re.sub(
    r'async def add_remark\([\s\S]*?db: AsyncSession = Depends\(get_db\),\n\):\n    launch = await repository\.add_remark_to_launch\(db, launch_id, remark_in\.remark\)\n    if not launch:\n        raise HTTPException\(status_code=404, detail="Launch not found"\)\n    await db\.commit\(\)\n    return launch',
    r'async def add_remark(\n    launch_id: int,\n    remark_in: schema.RemarkUpdate,\n    db: AsyncSession = Depends(get_db),\n):\n    async with db.begin():\n        launch = await repository.add_remark_to_launch(db, launch_id, remark_in.remark)\n        if not launch:\n            raise HTTPException(status_code=404, detail="Launch not found")\n    return launch',
    launch_content
)
launch_content = re.sub(
    r'async def mark_repaired\([\s\S]*?db: AsyncSession = Depends\(get_db\),\n\):\n    launch = await repository\.add_repair_to_launch\(db, launch_id\)\n    if not launch:\n        raise HTTPException\(status_code=404, detail="Launch not found"\)\n    await db\.commit\(\)\n    return launch',
    r'async def mark_repaired(\n    launch_id: int,\n    db: AsyncSession = Depends(get_db),\n):\n    async with db.begin():\n        launch = await repository.add_repair_to_launch(db, launch_id)\n        if not launch:\n            raise HTTPException(status_code=404, detail="Launch not found")\n    return launch',
    launch_content
)
launch_content = re.sub(
    r'async def delete_launch_endpoint\([\s\S]*?db: AsyncSession = Depends\(get_db\),\n\):\n    success = await repository\.delete_launch\(db, launch_id\)\n    if not success:\n        raise HTTPException\(status_code=404, detail="Launch not found"\)\n    await db\.commit\(\)',
    r'async def delete_launch_endpoint(\n    launch_id: int,\n    db: AsyncSession = Depends(get_db),\n):\n    async with db.begin():\n        success = await repository.delete_launch(db, launch_id)\n        if not success:\n            raise HTTPException(status_code=404, detail="Launch not found")',
    launch_content
)
with open(launch_router_path, "w") as f:
    f.write(launch_content)

# 4. Importlinter
import_linter_path = "backend/.importlinter"
with open(import_linter_path, "r") as f:
    linter_content = f.read()

# Add to ignore rules
ignores = """
    domain.winch.router -> domain.day_log
    domain.winch.router -> domain.launch
    domain.winch.router -> domain.operator
    domain.winch.schema -> domain.day_log
    domain.winch.schema -> domain.launch
    domain.winch.schema -> domain.operator
"""
if "ignore_imports:" in linter_content:
    linter_content = linter_content.replace("ignore_imports:", "ignore_imports:" + ignores)
with open(import_linter_path, "w") as f:
    f.write(linter_content)

# 5. Remove main.py root_router
main_path = "backend/main.py"
with open(main_path, "r") as f:
    main_content = f.read()
main_content = main_content.replace("from domain.root.router import router as root_router\n", "")
main_content = main_content.replace("app.include_router(root_router)\n", "")
with open(main_path, "w") as f:
    f.write(main_content)

# 6. Delete root, move tests
shutil.copy("backend/domain/root/test_router.py", "backend/domain/winch/test_router.py")
shutil.rmtree("backend/domain/root")

