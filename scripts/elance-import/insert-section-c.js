// insert-section-c.js
// Generates SQL INSERT statements for CMA Part 1 Section C questions
// exam_id = '7e48129a-35ae-41a2-9cb8-8bb3f7227578'
// section_id = 'cma_p1_c'
// positions: 67-102

const EXAM_ID = '7e48129a-35ae-41a2-9cb8-8bb3f7227578';
const SECTION_ID = 'cma_p1_c';
const TOPIC = 'Performance Management';
const POSITION_OFFSET = 66; // positions start at 67

function esc(str) {
  return str.replace(/'/g, "''");
}

const questions = [
  {
    qNum: 1,
    stem: "The following performance report was prepared for Celo Manufacturing for the month of April.\n\nActual result static budget variance\n\nSales unit 130,000 90,000 40,000 F\n\nRevenue $ 210,000 $ 170,000 $ 40,000 F\n\nVariable cost 135,000 98,000 37,000 U\n\nFixed cost 45,000 40,000 5,000 U\n\nOperating income $ 30,000 $ 32,000 $ 2,000 U\n\nUsing a flexible budget, Celo's total sales volume variance is",
    choices: [
      { key: 'A', text: '$4,000 unfavorable.' },
      { key: 'B', text: '$32,000 favorable.' },
      { key: 'C', text: '$20,000 unfavorable.' },
      { key: 'D', text: '$16,000 favorable.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 2,
    stem: "In the month of July, Royer Industries reported a total variance of $65,473. Because the variance is usually less than $10,000, the CEO asked for a report detailing the exact cause of the variance. How would the accountants at Royer find the cause of the variance?",
    choices: [
      { key: 'A', text: 'Start by determining the variance per unit rather than total variance.' },
      { key: 'B', text: 'Start by calculating separate variances for direct materials, direct labor, and overhead.' },
      { key: 'C', text: 'Start by calculating separate variances for price and quantity.' },
      { key: 'D', text: 'Start by talking to the different departments to determine what they think the cause of the variance is' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 3,
    stem: "Windell Company uses flexible budgets. At a normal capacity of 8,000 units, budgeted manufacturing overhead is: $64,000 variable and $180,000 fixed. If Windell had actual overhead costs of $250,000 for 10,000 units produced, what is the variance between actual and budgeted costs?",
    choices: [
      { key: 'A', text: '$10,000 unfavorable' },
      { key: 'B', text: '$6,000 favorable.' },
      { key: 'C', text: '$10,000 favorable' },
      { key: 'D', text: '$6,000 favorable.' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 4,
    stem: "The following data pertain to Vavara Inc.\'s direct materials for the month of June:\n\nStandard price per unit of input: $16 per pound\nActual price per unit of input: $13 per pound\nActual output: 20,000 units\nStandard input quantity allowed for actual output: 50,000 pounds\nDirect materials price variance: $120,000 favorable\n\nWhat is the direct materials quantity variance?",
    choices: [
      { key: 'A', text: '$40,000 unfavorable.' },
      { key: 'B', text: '$70,000 unfavorable.' },
      { key: 'C', text: '$160,000 unfavorable' },
      { key: 'D', text: '$80,000 unfavorable' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 5,
    stem: "Noora and Basima were calculating materials variances for the company. Both needed to know the actual quantity and standard price of materials. However, only Noora needed to know the actual price of the materials, and only Basima needed to know the standard quantity of materials. Why?",
    choices: [
      { key: 'A', text: 'Noora was calculating materials price variance, whereas Basima was calculating materials quantity variance.' },
      { key: 'B', text: 'Noora was calculating materials quantity variance, whereas Basima was calculating materials quality variance.' },
      { key: 'C', text: 'Noora was calculating materials quality variance, whereas Basima was calculating materials price variance' },
      { key: 'D', text: 'Noora was calculating materials quantity variance, whereas Basima was calculating materials price variance' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 6,
    stem: "The flexible budget for production of snack cakes by Grandma\'s Bakery is based on 50,000 units produced per month. For this level of production, indirect materials are $8,500, indirect labor is $9,300, utilities are $3,000, depreciation is $6,000, and supervision is $1,500. In the month of November, they spent $7,950 for indirect materials, $8,990 for indirect labor, and $3,400 for utilities to make 50,000 snack cakes. What was the variance in variable costs for November?",
    choices: [
      { key: 'A', text: '$460 unfavorable' },
      { key: 'B', text: '$860 favorable.' },
      { key: 'C', text: '$460 favorable' },
      { key: 'D', text: '$860 unfavorable' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 7,
    stem: "All of the following events are likely to cause a revenue variance at a company, except:",
    choices: [
      { key: 'A', text: 'A strike at a supplier prevents a company from receiving goods needed to fulfill orders' },
      { key: 'B', text: 'A strike at a competitor prevents that company from fulfilling its orders.' },
      { key: 'C', text: 'A company runs commercials based on research demonstrating the superiority of its products over competitors\' products' },
      { key: 'D', text: 'A company runs commercials in honor of its recently deceased founder.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 8,
    stem: "Lee Company\'s static budget shows $27,000 budgeted for direct materials, $36,000 budgeted for direct labor, and $9,000 budgeted for overhead. Lee\'s actual direct materials were $28,000, actual direct labor was $34,000, and actual overhead was $9,200. What is the total difference between the static budget and actual, and is the difference favorable or unfavorable?",
    choices: [
      { key: 'A', text: '$800, unfavorable' },
      { key: 'B', text: '$800, favorable' },
      { key: 'C', text: '$3,200, favorable' },
      { key: 'D', text: '$3,200, unfavorable' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 9,
    stem: "Which of the following circumstances suggests that a company is experiencing efficiencies in their purchasing department?",
    choices: [
      { key: 'A', text: 'The company has a favorable direct materials variance because it has a new machine that wastes fewer raw materials.' },
      { key: 'B', text: 'The company has a favorable direct materials variance because it now charges shipping costs to the customer.' },
      { key: 'C', text: 'The company has a favorable direct materials variance because it now charges shipping costs to the customer.' },
      { key: 'D', text: 'The company has a favorable direct materials variance because it no longer has to pay shipping costs for raw materials.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 10,
    stem: "Perma Corporation\'s management has determined that the company\'s required rate of return on new projects is 8%. The Diddle Division, a highly profitable division, has a current Return on Investment of 13%. The Diddle Division\'s manager is considering a new project that would involve manufacturing frazzles. The project is expected to require an investment of $1 million and to have an annual Return on Investment of 10%. What is the project\'s projected Residual Income?",
    choices: [
      { key: 'A', text: '$100,000' },
      { key: 'B', text: '$20,000.' },
      { key: 'C', text: '$0.' },
      { key: 'D', text: '$(30,000).' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 11,
    stem: "The yoyT Company manufactures Maxi Dolls for sale in toy stores. In planning for this year, yoyT estimated variable factory overheard of $600,000 and fixed factory overhead of $400,000. yoyT uses a standard costing system, and factory overhead is allocated to units produced on the basis of standard direct labor hours. The denominator level of activity budgeted for this year was 10,000 direct labor hours, and yoyT used 10,300 actual direct labor hours.\n\nBased on the output accomplished during the year, 9,900 standard direct labor hours should have been used. Actual variable factory overhead was $596,000, and actual fixed factory overhead was $410,000 for the year. Based on this information, the fixed overhead production volume variance for yoyT for this year is",
    choices: [
      { key: 'A', text: '$10,000 unfavorable.' },
      { key: 'B', text: '$16,000 unfavorable' },
      { key: 'C', text: '$4,000 unfavorable.' },
      { key: 'D', text: '$6,000 unfavorable.' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 12,
    stem: "Riya Company makes and distributes beach equipment. Last year its sales were $15,000,000, net income was $1,500,000, and the assets used were $35,000,000. The return on investment was",
    choices: [
      { key: 'A', text: '43%.' },
      { key: 'B', text: '4.3%.' },
      { key: 'C', text: '10%.' },
      { key: 'D', text: 'None of the answer choices are correct' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 13,
    stem: "Baspa Company uses a standard costing system. Variable manufacturing overhead is allocated to products based on budgeted direct labor hours per unit. The fixed portion of the overhead is allocated on a per unit basis at a budgeted rate set at the beginning of the month. The following information was gathered about production overhead costs in May 20X4:\n\nBudgeted data for May 20X4:\nDirect labor hours, 0.35 hours per unit\nVariable manufacturing overhead rate, $12.00 per hour\nFixed manufacturing overhead, $385,000\nPlanned level of production, 9,500 units\n\nActual results for May 20X4:\nVariable manufacturing overhead rate, $11.50 per hour\nActual output, 10,000 units\nTotal direct labor hours, 3,550 hours\nFixed manufacturing overhead, $390,000\n\nThe variable manufacturing overhead spending variance for May 20X4 was",
    choices: [
      { key: 'A', text: '$1,775 favorable.' },
      { key: 'B', text: '$1,750 favorable.' },
      { key: 'C', text: '$1,750 unfavorable.' },
      { key: 'D', text: '$1,775 unfavorable.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 14,
    stem: "Baspa Company uses a standard costing system. Variable manufacturing overhead is allocated to products based on budgeted direct labor hours per unit. The fixed portion of the overhead is allocated on a per unit basis at a budgeted rate set at the beginning of the month. The following information was gathered about production overhead costs in May 20X4:\n\nBudgeted data for May 20X4:\nDirect labor hours, 0.35 hours per unit\nVariable manufacturing overhead rate, $12.00 per hour\nFixed manufacturing overhead, $385,000\nPlanned level of production, 9,500 units\n\nActual results for May 20X4:\nVariable manufacturing overhead rate, $11.50 per hour\nActual output, 10,000 units\nTotal direct labor hours, 3,550 hours\nFixed manufacturing overhead, $390,000\n\nThe variable manufacturing overhead efficiency variance for May 20X4 was",
    choices: [
      { key: 'A', text: '$575 favorable.' },
      { key: 'B', text: '$600 unfavorable.' },
      { key: 'C', text: '$600 favorable' },
      { key: 'D', text: '$575 unfavorable.' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 15,
    stem: "The standard direct material cost per unit for a product is calculated as follows: 10.5 liters at $2.50 per liter. Last month the actual price paid for 12,000 liters of material used was 4% above standard and the direct material usage variance was $1,815 favorable. No inventory of material is held.\n\nWhat was the direct material price variance for last month?",
    choices: [
      { key: 'A', text: '$1,260.' },
      { key: 'B', text: '$1,212 unfavorable.' },
      { key: 'C', text: '$1,200 favorable' },
      { key: 'D', text: '$1,200 unfavorable.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 16,
    stem: "A company operates a standard costing system. Last month actual fixed overhead expenditure was 2% below budget and the fixed overhead expenditure variance was $1,250.\n\nWhat was the actual fixed overhead expenditure for last month?",
    choices: [
      { key: 'A', text: '$62,475.' },
      { key: 'B', text: '$61,250.' },
      { key: 'C', text: '$62,500.' },
      { key: 'D', text: '$63,750.' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 17,
    stem: "GreenGro Company produces lawn fertilizer. The standard costs and inputs for a 500-pound batch of fertilizer are below.\n\nChemical Standard Input Qty per batch (in pounds) Standard cost per pound Total cost\nNitrogen 120 $0.250 $30.00\nPhosphorus 10 17.984 179.84\nPotassium 40 2.440 97.60\nFiller (inert ingredients) 330 0.490 161.70\nTotal 500 $469.14\n\nThe beginning materials inventory was zero. The quantities purchased and used during the current period are shown below. A total of 150 batches were produced during the current period.\n\nChemical Qty Purchased (in pounds) Total purchase price Qty used (in pounds)\nNitrogen 20,000 $5,600 18,400\nPhosphorus 1,300 23,595 1,500\nPotassium 7,500 17,625 6,450\nFiller (inert ingredients) 50,000 22,500 48,650\nTotal 78,800 $69,320 75,000\n\nWhat is the materials mix variance for this operation?",
    choices: [
      { key: 'A', text: '$1,725.50 favorable' },
      { key: 'B', text: '$821.10 unfavorable' },
      { key: 'C', text: '$781.50 unfavorable' },
      { key: 'D', text: '$944.00 favorable' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 18,
    stem: "GreenGro Company produces lawn fertilizer. The standard costs and inputs for a 500-pound batch of fertilizer are below.\n\nChemical Standard Input Qty per batch (in pounds) Standard cost per pound Total cost\nNitrogen 120 $0.250 $30.00\nPhosphorus 10 17.984 179.84\nPotassium 40 2.440 97.60\nFiller (inert ingredients) 330 0.490 161.70\nTotal 500 $469.14\n\nThe beginning materials inventory was zero. The quantities purchased and used during the current period are shown below. A total of 150 batches were produced during the current period.\n\nChemical Qty Purchased (in pounds) Total purchase price Qty used (in pounds)\nNitrogen 20,000 $5,600 18,400\nPhosphorus 1,300 23,595 1,500\nPotassium 7,500 17,625 6,450\nFiller (inert ingredients) 50,000 22,500 48,650\nTotal 78,800 $69,320 75,000\n\nThe materials yield variance for this operation is",
    choices: [
      { key: 'A', text: 'Zero.' },
      { key: 'B', text: '$3,565.46 unfavorable.' },
      { key: 'C', text: '$3,565.46 favorable.' },
      { key: 'D', text: '$781.50 unfavorable.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 19,
    stem: "Universal Company uses a standard cost system and applies overhead to production on the basis of direct labor hours. Universal prepared the following budget at normal capacity for the month of January:\n\nDirect labor hours, 24,000\nVariable factory overhead, $48,000\nFixed factory overhead, $108,000\nTotal factory overhead per DLH, $6.50\n\nActual data for January were as follows:\nDirect labor hours worked, 22,000\nTotal factory overhead, $147,000\nStandard DLH allowed for capacity attained, 21,000\n\nUsing two-way analysis of overhead variances, what is the budget (controllable) variance for January?",
    choices: [
      { key: 'A', text: '$9,000 favorable.' },
      { key: 'B', text: '$13,500 unfavorable.' },
      { key: 'C', text: '$10,500 unfavorable' },
      { key: 'D', text: '$3,000 favorable.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 20,
    stem: "The following standard cost information is used by Bloomington Company for product BZ701:\n\nDirect material: 10 pieces of direct material per finished unit @ $4 per piece\nDirect labor: 2 hours @ $20 per hour\n\nThe company manufactured 5,000 units of BZ701 for job TKL1. Relevant data for this job were as follows:\n\nUnfavorable total direct materials variance, $27,500\nFavorable direct materials price variance $32,500\nUnfavorable direct labor rate variance, $7,000\nFavorable direct labor efficiency variance, $4,000\n\nWhat was the actual price per piece of direct material for the job TKL1?",
    choices: [
      { key: 'A', text: '$3.50.' },
      { key: 'B', text: '$3.35.' },
      { key: 'C', text: '$4.00.' },
      { key: 'D', text: '$4.42.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 21,
    stem: "The following standard cost information is used by Bloomington Company for product BZ701:\n\nDirect material: 10 pieces of direct material per finished unit @ $4 per piece\nDirect labor: 2 hours @ $20 per hour\n\nThe company manufactured 5,000 units of BZ701 for job TKL1. Relevant data for this job were as follows:\n\nUnfavorable total direct materials variance, $27,500\nFavorable direct materials price variance $32,500\nUnfavorable direct labor rate variance, $7,000\nFavorable direct labor efficiency variance, $4,000\n\nWhat was the total direct labor variance for the job TKL1?",
    choices: [
      { key: 'A', text: '$11,000 unfavorable.' },
      { key: 'B', text: '$3,000 favorable.' },
      { key: 'C', text: '$11,000 favorable.' },
      { key: 'D', text: '$3,000 unfavorable.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 22,
    stem: "Financial performance measures such as Return on Investment and Residual Income are _________________ indicators of the firm\'s performance.",
    choices: [
      { key: 'A', text: 'External' },
      { key: 'B', text: 'Lagging' },
      { key: 'C', text: 'Leading' },
      { key: 'D', text: 'Concurrent' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 23,
    stem: "When determining a transfer price, which of the following statements is correct?",
    choices: [
      { key: 'A', text: 'The minimum transfer price should be equal to the total production cost incurred by the selling division' },
      { key: 'B', text: 'The minimum transfer price should be the variable cost of production plus any opportunity cost, that is, any profit margin the selling division must give up by selling the product internally rather than externally.' },
      { key: 'C', text: 'The maximum transfer price should be the full cost of production plus a profit margin for the selling division.' },
      { key: 'D', text: 'The maximum transfer price should be equal to the market price plus a profit margin for the selling division.' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 24,
    stem: "Cweing uses a standard costing system in the manufacture of its single product. The 35,000 units of raw material in inventory were purchased for $105,000, and two units of raw material are required to produce one unit of final product. In November, the company produced 12,000 units of product. The standard cost for material allowed for the output was $60,000, and there was an unfavorable quantity variance of $2,500.\n\nThe units of material used to produce November output totaled",
    choices: [
      { key: 'A', text: '23,000 units.' },
      { key: 'B', text: '25,000 units.' },
      { key: 'C', text: '12,500 units.' },
      { key: 'D', text: '12,000 units.' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 25,
    stem: "Which of the following departments is generally responsible for an unfavorable material price variance",
    choices: [
      { key: 'A', text: 'Quality control' },
      { key: 'B', text: 'Purchasing' },
      { key: 'C', text: 'Engineering' },
      { key: 'D', text: 'Production' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 26,
    stem: "During the first quarter, Tillman\'s Toys had an unfavorable budget variance of 6%. In the second quarter, Tillman\'s variance dropped to .5%. How does the materiality of the first quarter variance differ from that of the second quarter variance?",
    choices: [
      { key: 'A', text: 'Both variances are significant. As a result, management will take corrective action after both the first and the second quarters' },
      { key: 'B', text: 'The first quarter variance is not significant, while the second quarter variance is significant. As a result, management did not take corrective action after the first quarter but will take corrective action after the second quarter.' },
      { key: 'C', text: 'Neither variance is significant. As a result, management will not take corrective action after either the first or the second quarter.' },
      { key: 'D', text: 'The first quarter variance is significant while the second quarter variance is not. As a result, management took corrective action after the first quarter but will not take corrective action after the second quarter.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 27,
    stem: "All of the following are methods for determining transfer prices except",
    choices: [
      { key: 'A', text: 'variable cost pricing' },
      { key: 'B', text: 'full cost pricing' },
      { key: 'C', text: 'fixed cost pricing' },
      { key: 'D', text: 'market-based pricing' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 28,
    stem: "The fabric division of Sweet Petunia\'s Baby Gear produces fabric designs to be used by the furniture division. The fabric division sells fabric to outside customers for $800 per bolt. Variable product costs total $575 per bolt, while variable selling and marketing costs are $75 per bolt. What is the transfer price if a market-based transfer policy is in effect?",
    choices: [
      { key: 'A', text: '$575 per bolt' },
      { key: 'B', text: '$650 per bolt' },
      { key: 'C', text: '$725 per bolt' },
      { key: 'D', text: '$800 per bolt' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 29,
    stem: "The HJU Company has two investment centers. Investment Center A uses accounting methods that tend to increase current income while Investment Center B uses accounting methods that tend to decrease current income. How will the accounting methods used affect the current evaluation of these investment centers?",
    choices: [
      { key: 'A', text: 'Investment Center B will appear more profitable than Investment Center A.' },
      { key: 'B', text: 'Investment Center A will appear more profitable than Investment Center B.' },
      { key: 'C', text: 'This will not affect the evaluation of the centers' },
      { key: 'D', text: 'It is not possible to conclude anything about the evaluation of these centers.' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 30,
    stem: "Each of the following statements concerning return on investment (ROI) and residual income is correct, except:",
    choices: [
      { key: 'A', text: 'Both measures can be used to evaluate investment centers.' },
      { key: 'B', text: 'Both measures use the company\'s minimum required rate of return as part of their calculations.' },
      { key: 'C', text: 'Both measures can be affected by the accounting choices a company makes.' },
      { key: 'D', text: 'Both measures use operating income and assets' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 31,
    stem: "A division has sales of $10,000,000, variable costs of $4,500,000, fixed costs of $3,500,000, and assets of $12,000,000. If the company\'s minimum required rate of return is 14% and the company\'s current ROI is 18%, what is the division\'s residual income?",
    choices: [
      { key: 'A', text: '$320,000' },
      { key: 'B', text: '($160,000)' },
      { key: 'C', text: '$600,000' },
      { key: 'D', text: '$1,680,000' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 32,
    stem: "Which of the following correctly describes what it means when a business unit has a negative residual income?",
    choices: [
      { key: 'A', text: 'The business unit\'s actual operating income is lower than its budgeted operating income.' },
      { key: 'B', text: 'The business unit\'s operating income is higher than the product of its investment base and minimum required rate of return.' },
      { key: 'C', text: 'The business unit\'s operating income is lower than the product of its investment base and current return on investment.' },
      { key: 'D', text: 'The business unit\'s operating income is lower than the product of its investment base and minimum required rate of return.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 33,
    stem: "Washington Fruits has sales of $942,000. Its variable costs are $623,000, fixed costs are $122,000, and total assets are $1,500,000. Washington Fruits found a new packaging supplier that charged 0.8 cents less per package, effectively reducing its variable costs by 3%. Based on this, Washington Fruits\' change in ROI would be a:",
    choices: [
      { key: 'A', text: '1.25 % decrease' },
      { key: 'B', text: '1.49% increase' },
      { key: 'C', text: '1.25% increase' },
      { key: 'D', text: '0.99% increase' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 34,
    stem: "A division has sales of $5,000,000, variable costs of $2,400,000, fixed costs of $2,000,000, and assets of $4,000,000. If the company\'s minimum required rate of return is 11% and the company\'s current ROI is 14%, what is the division\'s residual income?",
    choices: [
      { key: 'A', text: '$160,000' },
      { key: 'B', text: '$40,000' },
      { key: 'C', text: '$50,000' },
      { key: 'D', text: '$600,000' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 35,
    stem: "Return on investment focuses on income as a percentage of investment, while residual income focuses on:",
    choices: [
      { key: 'A', text: 'the capital charge' },
      { key: 'B', text: 'operating income less a capital charge' },
      { key: 'C', text: 'management decisions' },
      { key: 'D', text: 'cost of capital times the amount of investment' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 36,
    stem: "A division has sales of $8,000,000, variable costs of $3,200,000, fixed costs of $3,600,000, and assets of $10,000,000. If the company\'s minimum required rate of return is 14% and the company\'s current ROI is 16%, what is the division\'s residual income?",
    choices: [
      { key: 'A', text: '($400,000)' },
      { key: 'B', text: '$80,000' },
      { key: 'C', text: '$1,200,000' },
      { key: 'D', text: '($200,000)' },
    ],
    correctKey: 'D',
  },
];

// Build and output SQL INSERT statements
questions.forEach((q) => {
  const position = POSITION_OFFSET + q.qNum; // 67..102

  // Build choices JSON array — escape any single quotes in text for SQL
  const choicesArr = q.choices.map((c) => ({ key: c.key, text: c.text }));
  const choicesJson = JSON.stringify(choicesArr);
  // Escape single quotes inside the JSON string for embedding in SQL literal
  const choicesEscaped = choicesJson.replace(/'/g, "''");

  const metadataJson = JSON.stringify({ source: 'elance', section: 'C' });

  const sql =
    `INSERT INTO public.mcq_questions ` +
    `(exam_id, section_id, topic, stem, choices, correct_key, explanation, difficulty, position, metadata) VALUES (\n` +
    `  '${EXAM_ID}',\n` +
    `  '${SECTION_ID}',\n` +
    `  '${esc(TOPIC)}',\n` +
    `  '${esc(q.stem)}',\n` +
    `  '${choicesEscaped}'::jsonb,\n` +
    `  '${q.correctKey}',\n` +
    `  '',\n` +
    `  'medium',\n` +
    `  ${position},\n` +
    `  '${metadataJson}'::jsonb\n` +
    `);`;

  console.log(sql);
  console.log();
});
