import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeBranchDto } from './create-employee-branch.dto';

export class UpdateEmployeeBranchDto extends PartialType(CreateEmployeeBranchDto) {}
