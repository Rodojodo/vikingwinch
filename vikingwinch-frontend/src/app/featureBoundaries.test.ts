import {describe, expect, it} from 'vitest';
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('Feature slice boundaries (Oxlint enforcement)', () => {
    it('fails when a feature imports from a sibling feature directly', () => {
        const tempFixture = path.resolve(process.cwd(), 'src/features/day-ops/temp-violating-import.ts');
        fs.writeFileSync(
            tempFixture,
            "import { useLaunchOps } from '../../launch-ops/hooks/useLaunchOps';\nconsole.log(useLaunchOps);\n"
        );

        let exitCode = 0;
        let output = '';

        try {
            execSync(`npx oxlint -c .oxlintrc.json ${tempFixture}`, {
                cwd: process.cwd(),
                encoding: 'utf8',
            });
        } catch (err: unknown) {
            const execErr = err as { status?: number; stdout?: string; stderr?: string };
            exitCode = execErr.status ?? 1;
            output = (execErr.stdout ?? '') + (execErr.stderr ?? '');
        } finally {
            if (fs.existsSync(tempFixture)) {
                fs.unlinkSync(tempFixture);
            }
        }

        expect(exitCode).not.toBe(0);
        expect(output).toContain('no-restricted-imports');
        expect(output).toContain('Cross-feature imports are forbidden outside src/app/');
    });
});
