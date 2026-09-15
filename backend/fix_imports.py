import os
import re

MAPPINGS = {
    r'models\.base': 'database.base',
    r'models\.day_log': 'domain.day_log.model',
    r'models\.launch': 'domain.launch.model',
    r'models\.operator': 'domain.operator.model',
    r'models\.squadron': 'domain.squadron.model',
    r'models\.winch': 'domain.winch.model',
    
    r'repositories\.day_log_repo': 'domain.day_log.repository',
    r'repositories\.launch_repo': 'domain.launch.repository',
    r'repositories\.operator_repo': 'domain.operator.repository',
    r'repositories\.squadron_repo': 'domain.squadron.repository',
    r'repositories\.winch_repo': 'domain.winch.repository',
    
    r'routers\.day_log': 'domain.day_log.router',
    r'routers\.launch': 'domain.launch.router',
    r'routers\.operator': 'domain.operator.router',
    r'routers\.squadron': 'domain.squadron.router',
    r'routers\.winch': 'domain.winch.router',
    
    # Also relative imports from routers or repositories that import from models
    r'from models import': 'from domain import', # careful with this
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for old, new in MAPPINGS.items():
        if old == r'from models import': continue
        new_content = re.sub(r'from ' + old + r' import', f'from {new} import', new_content)
        new_content = re.sub(r'import ' + old, f'import {new}', new_content)
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('.'):
    if '.venv' in root or '.git' in root or '__pycache__' in root:
        continue
    for file in files:
        if file.endswith('.py'):
            process_file(os.path.join(root, file))
