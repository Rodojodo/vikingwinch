import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import SkylogValues from './SkylogValues.tsx';

describe('SkylogValues', () => {
    it('renders finish hours and downloads without back navigation', () => {
        const onExportLog = vi.fn().mockResolvedValue(undefined);
        render(
            <SkylogValues
                winchId={1}
                squadron="sqn1"
                leftLaunches={10}
                rightLaunches={15}
                finishHours={126.2}
                onExportLog={onExportLog}
            />,
        );

        expect(screen.getByText('Winch 1 — sqn1')).toBeInTheDocument();
        expect(screen.getByText('126.2')).toBeInTheDocument();
        expect(screen.queryByRole('button', {name: 'Back'})).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', {name: 'Download Logs'}));
        expect(onExportLog).toHaveBeenCalledTimes(1);
    });
});
