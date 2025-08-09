/**
 * Demo Reference Data Templates
 * 
 * Pre-built reference data sets that are immediately relatable for demos,
 * showing clear value and relationships that users can easily understand.
 */

export interface DemoTemplate {
  id: string;
  name: string;
  description: string;
  filename: string;
  data: Record<string, any>[];
  suggestedLookups: Array<{
    matchOn: string;
    returnField: string;
    alsoGet: string[];
    useCase: string;
  }>;
}

export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: 'company-departments',
    name: '🏢 Company Departments',
    description: 'Department information with managers, budgets, and locations',
    filename: 'departments.csv',
    data: [
      {
        dept_name: 'Engineering',
        dept_code: 'ENG001',
        manager: 'Sarah Johnson',
        budget: 500000,
        location: 'Building A - Floor 3',
        headcount: 25,
        cost_center: '4100',
        established: '2010-01-15'
      },
      {
        dept_name: 'Marketing',
        dept_code: 'MKT001', 
        manager: 'Mike Chen',
        budget: 250000,
        location: 'Building B - Floor 2',
        headcount: 12,
        cost_center: '3200',
        established: '2012-03-20'
      },
      {
        dept_name: 'Sales',
        dept_code: 'SLS001',
        manager: 'Lisa Wong',
        budget: 300000,
        location: 'Building C - Floor 1',
        headcount: 18,
        cost_center: '3100',
        established: '2011-06-10'
      },
      {
        dept_name: 'Human Resources',
        dept_code: 'HR001',
        manager: 'David Rodriguez',
        budget: 150000,
        location: 'Building A - Floor 1',
        headcount: 8,
        cost_center: '2100',
        established: '2010-01-15'
      },
      {
        dept_name: 'Finance',
        dept_code: 'FIN001',
        manager: 'Jennifer Kim',
        budget: 180000,
        location: 'Building A - Floor 2',
        headcount: 10,
        cost_center: '2200',
        established: '2010-02-01'
      }
    ],
    suggestedLookups: [
      {
        matchOn: 'dept_name',
        returnField: 'dept_code',
        alsoGet: ['manager', 'budget', 'location'],
        useCase: 'Convert department names to codes and get key info'
      }
    ]
  },

  {
    id: 'product-catalog',
    name: '📦 Product Catalog',
    description: 'Product information with pricing, suppliers, and specifications',
    filename: 'products.csv',
    data: [
      {
        product_name: 'MacBook Pro 16"',
        sku: 'MBP16-2024',
        category: 'Electronics',
        price: 2499,
        supplier: 'Apple Inc.',
        warranty: '1 year',
        weight: '4.7 lbs',
        color: 'Space Gray'
      },
      {
        product_name: 'iPhone 15 Pro',
        sku: 'IP15P-128',
        category: 'Electronics', 
        price: 999,
        supplier: 'Apple Inc.',
        warranty: '1 year',
        weight: '0.48 lbs',
        color: 'Titanium Blue'
      },
      {
        product_name: 'Aeron Office Chair',
        sku: 'AER-BLK-B',
        category: 'Furniture',
        price: 1195,
        supplier: 'Herman Miller',
        warranty: '12 years',
        weight: '48 lbs',
        color: 'Black'
      },
      {
        product_name: 'Standing Desk Pro',
        sku: 'SDK-72-OAK',
        category: 'Furniture',
        price: 599,
        supplier: 'Uplift Desk',
        warranty: '5 years',
        weight: '120 lbs',
        color: 'Oak'
      },
      {
        product_name: 'Wireless Mouse',
        sku: 'MX3-BLK',
        category: 'Accessories',
        price: 79,
        supplier: 'Logitech',
        warranty: '3 years',
        weight: '0.2 lbs',
        color: 'Black'
      }
    ],
    suggestedLookups: [
      {
        matchOn: 'product_name',
        returnField: 'sku',
        alsoGet: ['price', 'supplier', 'category'],
        useCase: 'Convert product names to SKUs and get pricing info'
      }
    ]
  },

  {
    id: 'us-states',
    name: '🇺🇸 US States & Regions',
    description: 'State information with regions, populations, and capitals',
    filename: 'us_states.csv',
    data: [
      {
        state_name: 'California',
        state_code: 'CA',
        region: 'West',
        capital: 'Sacramento',
        population: 39538223,
        timezone: 'Pacific',
        area_sq_miles: 163696
      },
      {
        state_name: 'Texas',
        state_code: 'TX', 
        region: 'South',
        capital: 'Austin',
        population: 29145505,
        timezone: 'Central',
        area_sq_miles: 268596
      },
      {
        state_name: 'New York',
        state_code: 'NY',
        region: 'Northeast',
        capital: 'Albany',
        population: 20201249,
        timezone: 'Eastern',
        area_sq_miles: 54555
      },
      {
        state_name: 'Florida',
        state_code: 'FL',
        region: 'South',
        capital: 'Tallahassee', 
        population: 21538187,
        timezone: 'Eastern',
        area_sq_miles: 65758
      },
      {
        state_name: 'Illinois',
        state_code: 'IL',
        region: 'Midwest',
        capital: 'Springfield',
        population: 12812508,
        timezone: 'Central',
        area_sq_miles: 57914
      }
    ],
    suggestedLookups: [
      {
        matchOn: 'state_name',
        returnField: 'state_code',
        alsoGet: ['region', 'timezone', 'population'],
        useCase: 'Convert state names to codes and get geographic info'
      }
    ]
  },

  {
    id: 'customer-segments',
    name: '👥 Customer Segments',
    description: 'Customer segment data with pricing tiers and account managers',
    filename: 'customer_segments.csv',
    data: [
      {
        segment_name: 'Enterprise',
        segment_code: 'ENT',
        account_manager: 'Sarah Mitchell',
        discount_rate: 0.15,
        credit_limit: 100000,
        payment_terms: 'Net 30',
        priority_level: 'High'
      },
      {
        segment_name: 'Mid-Market',
        segment_code: 'MID',
        account_manager: 'James Park',
        discount_rate: 0.10,
        credit_limit: 25000,
        payment_terms: 'Net 15',
        priority_level: 'Medium'
      },
      {
        segment_name: 'Small Business',
        segment_code: 'SMB',
        account_manager: 'Maria Lopez',
        discount_rate: 0.05,
        credit_limit: 5000,
        payment_terms: 'Net 10',
        priority_level: 'Standard'
      },
      {
        segment_name: 'Startup',
        segment_code: 'STU',
        account_manager: 'Alex Kim',
        discount_rate: 0.20,
        credit_limit: 2500,
        payment_terms: 'Prepaid',
        priority_level: 'High'
      }
    ],
    suggestedLookups: [
      {
        matchOn: 'segment_name',
        returnField: 'segment_code',
        alsoGet: ['account_manager', 'discount_rate', 'priority_level'],
        useCase: 'Assign customer segments and get account details'
      }
    ]
  },

  {
    id: 'job-levels',
    name: '💼 Job Levels & Compensation',
    description: 'Job level information with salary ranges and benefits',
    filename: 'job_levels.csv',
    data: [
      {
        level_name: 'Junior Engineer',
        level_code: 'E1',
        salary_min: 65000,
        salary_max: 85000,
        bonus_target: 0.10,
        pto_days: 15,
        department: 'Engineering'
      },
      {
        level_name: 'Senior Engineer',
        level_code: 'E3',
        salary_min: 90000,
        salary_max: 130000,
        bonus_target: 0.15,
        pto_days: 20,
        department: 'Engineering'
      },
      {
        level_name: 'Marketing Manager',
        level_code: 'M2',
        salary_min: 75000,
        salary_max: 105000,
        bonus_target: 0.20,
        pto_days: 18,
        department: 'Marketing'
      },
      {
        level_name: 'Sales Director',
        level_code: 'S4',
        salary_min: 120000,
        salary_max: 160000,
        bonus_target: 0.30,
        pto_days: 25,
        department: 'Sales'
      }
    ],
    suggestedLookups: [
      {
        matchOn: 'level_name',
        returnField: 'level_code',
        alsoGet: ['salary_min', 'salary_max', 'bonus_target'],
        useCase: 'Get job codes and compensation data'
      }
    ]
  }
];

/**
 * Get a demo template by ID
 */
export function getDemoTemplate(id: string): DemoTemplate | undefined {
  return DEMO_TEMPLATES.find(template => template.id === id);
}

/**
 * Get all demo templates
 */
export function getAllDemoTemplates(): DemoTemplate[] {
  return DEMO_TEMPLATES;
}

/**
 * Create sample input data that would work well with a demo template
 */
export function generateSampleInputData(templateId: string): Record<string, any>[] {
  const sampleData: Record<string, Record<string, any>[]> = {
    'company-departments': [
      { employee_name: 'John Smith', department: 'Engineering', start_date: '2022-01-15' },
      { employee_name: 'Jane Doe', department: 'Marketing', start_date: '2021-11-03' },
      { employee_name: 'Bob Wilson', department: 'Sales', start_date: '2023-02-20' },
      { employee_name: 'Alice Brown', department: 'Human Resources', start_date: '2022-08-12' },
    ],

    'product-catalog': [
      { order_id: 'ORD-001', product: 'MacBook Pro 16"', quantity: 2 },
      { order_id: 'ORD-002', product: 'iPhone 15 Pro', quantity: 1 },
      { order_id: 'ORD-003', product: 'Aeron Office Chair', quantity: 5 },
      { order_id: 'ORD-004', product: 'Standing Desk Pro', quantity: 3 },
    ],

    'us-states': [
      { customer_name: 'Acme Corp', state: 'California', revenue: 50000 },
      { customer_name: 'TechStart Inc', state: 'Texas', revenue: 25000 },
      { customer_name: 'BigCo Ltd', state: 'New York', revenue: 75000 },
      { customer_name: 'StartupXYZ', state: 'Florida', revenue: 15000 },
    ],

    'customer-segments': [
      { company: 'MegaCorp', segment: 'Enterprise', annual_revenue: 5000000 },
      { company: 'TechCorp', segment: 'Mid-Market', annual_revenue: 500000 },
      { company: 'SmallBiz', segment: 'Small Business', annual_revenue: 100000 },
      { company: 'NewCo', segment: 'Startup', annual_revenue: 25000 },
    ],

    'job-levels': [
      { employee: 'Sarah Johnson', position: 'Senior Engineer', hire_date: '2020-03-15' },
      { employee: 'Mike Chen', position: 'Marketing Manager', hire_date: '2021-07-20' },
      { employee: 'Lisa Wong', position: 'Sales Director', hire_date: '2019-11-08' },
      { employee: 'David Kim', position: 'Junior Engineer', hire_date: '2023-01-10' },
    ]
  };

  return sampleData[templateId] || [];
}