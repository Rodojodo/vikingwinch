import os
import glob
import re

features = ['auth', 'day-ops', 'launch-ops', 'remarks-repairs', 'trainee-ops', 'winch-ops']

for feat in features:
    types_dir = os.path.join('src/features', feat, 'types')
    type_files = glob.glob(os.path.join(types_dir, '*Types.ts'))
    if type_files:
        old_file = type_files[0]
        with open(old_file, 'r') as f:
            content = f.read()
        
        # We write everything to domain.ts
        content = re.sub(r"export type DrumPosition = 'left' \| 'right';\n", "", content)
        with open(os.path.join('src/features', feat, 'types', 'domain.ts'), 'w') as f:
            f.write(content)
        
        with open(os.path.join('src/features', feat, 'types', 'index.ts'), 'w') as f:
            f.write("export * from './domain';\n")
            
        os.remove(old_file)

