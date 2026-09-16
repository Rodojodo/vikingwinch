import type {LaunchResponse} from '../types/api';
import type {LaunchRecord} from '../types/domain';

export const toLaunchRecord = (dto: LaunchResponse): LaunchRecord => ({
    id: dto.id,
    launch_number: dto.launch_number,
    timestamp: dto.timestamp,
    remark: dto.remark,
    burn: dto.launch_number === null,
    operator_sn: dto.operator_sn,
});
