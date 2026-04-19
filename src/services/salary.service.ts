export interface SalaryBreakdown {
  grossSalary: number;
  tds: number;
  netSalary: number;
  country: string;
}

export class SalaryService {
  calculateNetSalary(gross: number, country: string): SalaryBreakdown {
    const normalized = country.toUpperCase().trim();
    let tdsRate = 0;

    if (normalized === 'INDIA') tdsRate = 0.10;
    else if (normalized === 'UNITED STATES' || normalized === 'USA') tdsRate = 0.12;

    const tds = gross * tdsRate;
    const netSalary = gross - tds;

    return {
      grossSalary: Number(gross.toFixed(2)),
      tds: Number(tds.toFixed(2)),
      netSalary: Number(netSalary.toFixed(2)),
      country
    };
  }
}