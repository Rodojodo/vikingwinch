import os
import re

TEST_FILES = [
    'src/pages/WinchTab.test.tsx',
    'src/features/day-ops/components/SignOnPanel.test.tsx',
    'src/features/launch-ops/components/LaunchPanel.test.tsx',
    'src/features/remarks-repairs/components/RemarksPanel.test.tsx',
    'src/features/remarks-repairs/components/RepairsPanel.test.tsx',
]

os.system('git checkout a07357429a6791a04522a05b5576386da385a616 -- ' + ' '.join([os.path.join('vikingwinch-frontend', f) for f in TEST_FILES]))

MOCKS = '''
vi.mock('SESSION_PATH', () => ({
    useSessionIdentity: vi.fn(() => ({ squadronId: 'sqn1', winchId: 42, operatorSn: 'OP1' }))
}));
vi.mock('TRAINEE_PATH', () => ({
    useTraineeOps: vi.fn(() => ({ traineeSn: null, setTrainee: vi.fn(), changeTrainee: vi.fn() }))
}));
vi.mock('LAUNCH_PATH', () => ({
    useLaunchOps: vi.fn(() => ({ 
        derived: { leftLastRecord: {}, rightLastRecord: {} }, 
        leftHistory: [], 
        rightHistory: [], 
        executeLaunch: vi.fn(), 
        undoLaunch: vi.fn(), 
        addRemarkToState: vi.fn() 
    }))
}));
vi.mock('DAY_PATH', () => ({
    useDayOps: vi.fn(() => ({ dayFinished: false, finishDay: vi.fn() }))
}));
'''

for file in TEST_FILES:
    path = os.path.join('vikingwinch-frontend', file)
    with open(path, 'r') as f:
        text = f.read()

    depth = file.count('/') - 1
    if file.startswith('src/pages'):
        features = '../features'
        core = '../core'
        app = '../app'
    else:
        features = '../../'
        core = '../../../core'
        app = '../../../app'

    session_path = app + '/providers/SessionIdentityProvider.tsx'
    trainee_path = features + '/trainee-ops/hooks/useTraineeOps.tsx'
    launch_path = features + '/launch-ops/hooks/useLaunchOps.tsx'
    day_path = features + '/day-ops/hooks/useDayOps.tsx'

    mock_block = MOCKS.replace('SESSION_PATH', session_path).replace('TRAINEE_PATH', trainee_path).replace('LAUNCH_PATH', launch_path).replace('DAY_PATH', day_path)

    m = re.search(r'import\s+\{([^}]+)\}\s+from\s+[\'\"].*?dataClient(?:\.ts)?[\'\"];', text)
    if m:
        funcs = [f.strip() for f in m.group(1).split(',')]
        
        day_ops = ['postDayLogToDb', 'getDayLog']
        launch_ops = ['postLaunchToDb', 'removeLaunchFromDb', 'getLaunches']
        remarks_ops = ['postRemarkToDb']
        winch_ops = ['getWinch', 'getWinchesForSquadron', 'getWinchHours', 'getBroughtForward']
        core_ops = ['getOperatorsForSquadron']
        
        new_imports = []
        new_mocks = []
        
        for client, ops_list, client_path in [
            ('dayOpsClient.ts', day_ops, features + '/day-ops/api/dayOpsClient.ts'),
            ('launchClient.ts', launch_ops, features + '/launch-ops/api/launchClient.ts'),
            ('remarksClient.ts', remarks_ops, features + '/remarks-repairs/api/remarksClient.ts'),
            ('winchClient.ts', winch_ops, features + '/winch-ops/api/winchClient.ts'),
            ('operatorsClient.ts', core_ops, core + '/http/operatorsClient.ts')
        ]:
            matches = [f for f in funcs if f in ops_list]
            if matches:
                new_imports.append(f'import {{ {", ".join(matches)} }} from "{client_path}";')
                new_mocks.append(f'vi.mock("{client_path}", () => ({{ {", ".join([f + ": vi.fn()" for f in matches])} }}));')
                
        text = re.sub(r'import\s+\{[^}]+\}\s+from\s+[\'\"].*?dataClient(?:\.ts)?[\'\"];', '\n'.join(new_imports), text)
        
        last_import = text.rfind('import ')
        end_of_import = text.find('\n', last_import) + 1
        text = text[:end_of_import] + '\n' + '\n'.join(new_mocks) + '\n' + text[end_of_import:]
        
    last_import = text.rfind('import ')
    end_of_import = text.find('\n', last_import) + 1
    text = text[:end_of_import] + '\n' + mock_block + '\n' + text[end_of_import:]
    
    # Safe multi-line mock removal
    text = re.sub(r'vi\.mock\([\s\'\"\./a-zA-Z\-]*?useWinchSession[\'\"\.ts]*?,.*?\}\)\);?', '', text, flags=re.DOTALL)
    text = re.sub(r'const mockUseWinchSession = vi\.mocked\(useWinchSession\);?', '', text)
    text = re.sub(r'mockUseWinchSession\.mockReturnValue(?:Once)?\(\{.*?\}(?:\s*as\s+any\s*)?\);', '', text, flags=re.DOTALL)
    text = re.sub(r'vi\.mocked\(useWinchSession\)\.mockReturnValue(?:Once)?\(\{.*?\}(?:\s*as\s+any\s*)?\);', '', text, flags=re.DOTALL)
    text = re.sub(r'import \{.*?useWinchSession.*?\} from .*?;', '', text)
    
    # Replace inline session prop cleanly
    text = re.sub(r'\s*session=\{[^}]*\}\s*', ' ', text)
    text = re.sub(r'\s*session=\{[^}]*\s*as\s*any\s*\}\s*', ' ', text)
    text = re.sub(r'\s*onComplete=\{[^}]*\}\s*', ' ', text)
    
    with open(path, 'w') as f:
        f.write(text)

