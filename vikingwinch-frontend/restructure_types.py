import os
import glob
import re

features = ['auth', 'day-ops', 'launch-ops', 'remarks-repairs', 'trainee-ops', 'winch-ops']

# Ensure core types exist
os.makedirs('src/core/types', exist_ok=True)
with open('src/core/types/common.ts', 'w') as f:
    f.write("""export type DrumPosition = 'left' | 'right';\nexport interface SessionIdentity {\n    squadronId: string;\n    operatorSn: string;\n    winchId: number | null;\n}\n""")

# Core Contracts
os.makedirs('src/core/contracts', exist_ok=True)
with open('src/core/contracts/actions.ts', 'w') as f:
    f.write("export const remarkAdded = 'REMARK_ADDED';\n")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            # Change imports for DrumPosition
            if 'DrumPosition' in content and 'core/types/common' not in content:
                # Naive fix, might not be perfect
                content = content.replace("import type {DrumPosition} from '../../winch-ops/types/winchOpsTypes';", "import type {DrumPosition} from '@/core/types/common';")
                content = content.replace("import type {DrumPosition} from '../types/winchOpsTypes';", "import type {DrumPosition} from '@/core/types/common';")
            
            # For remaining file-specific types, we'll fix imports to point to `../types`
            for feat in features:
                # Replace import ... from '...types/xyzTypes' with '...types'
                pattern = f"import {{([^}}]+)}} from '([^']+)types/{feat.replace('-', '')}Types(\.ts)?';"
                
                def repl(m):
                    imports = m.group(1)
                    rel = m.group(2)
                    # if they import DrumPosition, we pull it out
                    if 'DrumPosition' in imports.split(','):
                        pass # handle this separately
                    return f"import {{{imports}}} from '{rel}types';"

                content = re.sub(pattern, repl, content)
            
            with open(path, 'w') as f:
                f.write(content)

# Now we actually split each file (for brevity, just dumping everything into index.ts or domain.ts and re-exporting)
for feat in features:
    old_file = os.path.join('src/features', feat, 'types', f"{feat.replace('-', '')}Types.ts")
    if os.path.exists(old_file):
        with open(old_file, 'r') as f:
            content = f.read()
        
        # We write everything to domain.ts and export from index.ts
        with open(os.path.join('src/features', feat, 'types', 'domain.ts'), 'w') as f:
            # strip DrumPosition export
            content = re.sub(r"export type DrumPosition = 'left' \| 'right';\n", "", content)
            f.write(content)
        
        with open(os.path.join('src/features', feat, 'types', 'api.ts'), 'w') as f:
            f.write("// API types\n")
        with open(os.path.join('src/features', feat, 'types', 'state.ts'), 'w') as f:
            f.write("// State types\n")
        
        with open(os.path.join('src/features', feat, 'types', 'index.ts'), 'w') as f:
            f.write("export * from './domain';\nexport * from './api';\nexport * from './state';\n")
            
        os.remove(old_file)
