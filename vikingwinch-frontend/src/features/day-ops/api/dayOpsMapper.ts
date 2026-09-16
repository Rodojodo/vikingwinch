import type {DayLogResponse} from '../types/api';
import type {DayLogRecord} from '../types/domain';

export const toDayLogRecord = (dto: DayLogResponse): DayLogRecord => ({
    id: dto.id,
    squadronId: dto.squadron_id,
    winchId: dto.winch_id,
    operatorSn: dto.operator_sn,
    traineeSn: dto.trainee,
    type: dto.type,
    cableCheck: dto.cable_check,
    hours: dto.hours,
    timestamp: dto.timestamp,
});
