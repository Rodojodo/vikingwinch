import os
import re

TEST_FILES = [
    'src/pages/WinchTab.test.tsx',
    'src/features/day-ops/components/SignOnPanel.test.tsx',
    'src/features/launch-ops/components/LaunchPanel.test.tsx',
    'src/features/remarks-repairs/components/RemarksPanel.test.tsx',
    'src/features/remarks-repairs/components/RepairsPanel.test.tsx',
]

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

    # Determine relative path back to root
    depth = file.count('/') - 1
    up = '../' * depth
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

    # 1. Replace dataClient import
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
                
        text = re.sub(r'import\s+\{[^}]+\}\s+from\s+[\'\"].*?dataClient(?:\.ts)?[\'\"];', '\\n'.join(new_imports), text)
        
        last_import = text.rfind('import ')
        end_of_import = text.find('\n', last_import) + 1
        text = text[:end_of_import] + '\\n' + '\\n'.join(new_mocks) + '\\n' + text[end_of_import:]
        
    # Inject Context Mocks
    last_import = text.rfind('import ')
    end_of_import = text.find('\n', last_import) + 1
    text = text[:end_of_import] + '\\n' + mock_block + '\\n' + text[end_of_import:]
    
    # Remove mockUseWinchSession stuff safely line by line
    lines = text.split('\\n')
    new_lines = []
    for line in lines:
        if 'vi.mock' in line and 'useWinchSession' in line:
            continue
        if 'const mockUseWinchSession =' in line:
            continue
        if 'mockUseWinchSession.mockReturnValue' in line:
            continue
        if 'vi.mocked(useWinchSession).mockReturnValue' in line:
            continue
        if 'import' in line and 'useWinchSession' in line:
            continue
        # Remove session prop exactly
        line = line.replace(' session={mockSession}', '')
        line = line.replace(' session={mockSession as any}', '')
        line = line.replace(' session={null as any}', '')
        line = line.replace(' session={mockSessionWithoutOp as any}', '')
        line = line.replace(' onComplete={mockOnComplete}', '')
        line = line.replace(' onComplete={vi.fn()}', '')
        
        new_lines.append(line)
        
    text = '\\n'.join(new_lines)
    
    with open(path, 'w') as f:
        f.write(text)

