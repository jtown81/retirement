import { buildSalaryHistory } from './src/modules/career/projection';
import type { CareerProfile } from './src/models/career';

const profile: CareerProfile = {
  id: 'test',
  scdLeave: '2020-01-01',
  scdRetirement: '2020-01-01',
  paySystem: 'GS',
  events: [
    {
      id: 'hire',
      type: 'hire',
      effectiveDate: '2020-01-01',
      grade: 11,
      step: 1,
      localityCode: 'RUS',
      paySystem: 'GS',
      annualSalary: 65000,
    },
  ],
};

const history = buildSalaryHistory(profile, 2024, 0.02);
console.log('Salary History:');
history.forEach(y => console.log(`${y.year}: $${y.annualSalary.toFixed(2)}`));
