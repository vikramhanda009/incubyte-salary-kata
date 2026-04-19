export interface CreateEmployeeDto {
  fullName: string;
  jobTitle: string;
  country: string;
  salary: number;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  jobTitle?: string;
  country?: string;
  salary?: number;
}
