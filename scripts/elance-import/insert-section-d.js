// insert-section-d.js
// Generates SQL INSERT statements for CMA Part 1 Section D questions
// exam_id = '7e48129a-35ae-41a2-9cb8-8bb3f7227578'
// section_id = 'cma_p1_d'
// positions: 103-124

const EXAM_ID = '7e48129a-35ae-41a2-9cb8-8bb3f7227578';
const SECTION_ID = 'cma_p1_d';
const TOPIC = 'Cost Management';
const POSITION_OFFSET = 102; // positions start at 103

function esc(str) {
  return str.replace(/'/g, "''");
}

const questions = [
  {
    qNum: 1,
    stem: "Following is a manufacturing company's fixed overhead data used in developing its fixed overhead standard for the year and the actual data for the year. Overhead is applied based on standard machine hours per unit.\n\nBudgeted sales: 112,000 units\nBudgeted production: 100,000 units\nFixed overhead standard application rate: $2.25 per machine hour\nActual production: 98,000 units\nFixed overhead applied during the year: $441,000\n\nWhat was the standard number of machine hours allowed per unit?",
    choices: [
      { key: 'A', text: '1.75 machine hours per unit.' },
      { key: 'B', text: '2.25 machine hours per unit.' },
      { key: 'C', text: '1.96 machine hours per unit.' },
      { key: 'D', text: '2 machine hours per unit.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 2,
    stem: "Corporation manufactures products C, D, and E from a joint process. Joint costs are allocated on the basis of relative sales value at split-off. Additional information is presented below\n\nUnits produced: C 6,000, D 4,000, E 2,000, Total 12,000\nJoint costs: C $72,000, D ?, E ?, Total $120,000\nSales value at split-off: C ?, D ?, E $30,000, Total $200,000\nAdditional costs if processed further: C $14,000, D $10,000, E $6,000, Total $30,000\nSales value if processed further: C $140,000, D $60,000, E $40,000, Total $240,000\n\nHow much of the joint costs should Warfield allocate to product D?",
    choices: [
      { key: 'A', text: '32000' },
      { key: 'B', text: '24000' },
      { key: 'C', text: '28800' },
      { key: 'D', text: '30000' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 3,
    stem: "Meridian Company has established the following support cost pools and activity consumption cost drivers for October 20X7:\n\nCost pool: Purchase orders, Budgeted Support Costs $60,000, Cost Driver Levels 200 orders\nCost pool: Machine setups, Budgeted Support Costs $150,000, Cost Driver Levels 300 setups\nCost pool: Electricity, Budgeted Support Costs $30,000, Cost Driver Levels 100,000 kilowatt hours\n\nThe following information pertains to the actual consumption of activities for two representative jobs completed during October:\n\nJob C1: Number of units produced 2,000, Number of purchase orders 20, Number of setups 40, Number of kilowatt hours 1,000\nJob C2: Number of units produced 4,000, Number of purchase orders 30, Number of setups 40, Number of kilowatt hours 2,000\n\nWhat is the total support cost assigned to Job C1 using Activity-Based Costing?",
    choices: [
      { key: 'A', text: '$39,600.' },
      { key: 'B', text: '$15,000.' },
      { key: 'C', text: '$34,300.' },
      { key: 'D', text: '$26,300' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 4,
    stem: "MerrylandCo. manufactures a single product. Shown below are cost and sales data for the first year of operations. During the year, 10,000 finished units were manufactured, of which 9,000 were sold.\n\nSales (9000 units at $110 per unit) 990,000\nManufacturing costs for 10,000 finished units:\nVariable 200,000\nFixed 400,000\nSelling and administrative expenses:\nVariable ($5 per unit x 8,000 units sold) 40,000\nFixed 240,000\n\nThe company prepares two separate sets of income statements: one utilizing variable costing for internal use and the other utilizing full costing for external financial reporting.\n\nUnder variable costing, the valuations assigned to the ending inventory of finished goods and to the cost of goods sold are",
    choices: [
      { key: 'A', text: 'ending inventory $20000 and cost of goods sold $180000.' },
      { key: 'B', text: 'ending inventory $40,000 and cost of goods sold $160,000.' },
      { key: 'C', text: 'ending inventory $80,000 and cost of goods sold $200,000.' },
      { key: 'D', text: 'ending inventory $48,000 and cost of goods sold $192,000.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 5,
    stem: "Nikkoy Productions uses the following capacity levels for 20X5 in its decision making for the year:\n\nTheoretical capacity 16,000,000 units\nPractical capacity 15,000,000 units\nMaster budget capacity 14,500,000 units\nNormal capacity 14,750,000 units\n\nThe company's fixed manufacturing cost is $9,000,000 per year. During 20X5, ABC produced 14,250,000 units. How much did ABC's unused capacity cost the company during the year?",
    choices: [
      { key: 'A', text: '$375,000.' },
      { key: 'B', text: '$703,125.' },
      { key: 'C', text: '$394,737.' },
      { key: 'D', text: '$450,000' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 6,
    stem: "Datson Company has two service departments, Human Resources (HR) and Accounting (AC), and two production departments, Milling and Assembly. Departmental data for the month of May were as follows:\n\nHR Costs incurred: $40,000, AC Costs incurred: $30,000\nService provided to:\nHuman Resources: HR --, AC 20%\nAccounting: HR 10%, AC --\nMilling: HR 50%, AC 30%\nAssembly: HR 40%, AC 50%\n\nHow much service department costs are allocated to the Milling department if the company uses the reciprocal method of allocating its service department costs? (Round calculations to the nearest whole number.)",
    choices: [
      { key: 'A', text: '$23,051.' },
      { key: 'B', text: '$21,949.' },
      { key: 'C', text: '$18,900.' },
      { key: 'D', text: '$33,878' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 7,
    stem: "A paper manufacturer produces letter-sized paper and legal-sized paper as joint products and lignin as a byproduct. The letter-sized paper sells for $7.50 per ream and the legal-sized paper sells for $10.00 per ream.\n\nThe packaged lignin can be sold for $240 per pound. Packaging and shipping costs for the lignin are $16 per pound and sales commissions are 10% of the sales price. The net revenue of the byproduct serves to reduce joint processing costs for the joint products.\n\nJoint costs are allocated to joint products on the basis of the constant gross profit (gross margin) method. Information for one processing run follows.\n\nJoint processing costs $175,000\nLetter-sized paper (reams) 200,000\nLegal-sized paper (reams) 100,000\nLignin produced (pounds) 2,000\n\nWhat is the joint cost allocated to the letter-sized paper? (round to the nearest figure)",
    choices: [
      { key: 'A', text: '$1,050,000.' },
      { key: 'B', text: '$810,000' },
      { key: 'C', text: '$906,000.' },
      { key: 'D', text: '$930,000' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 8,
    stem: "A company produces and sells a single product. For the first quarter the company reports an operating profit of $90,000 under absorption costing. If the company reports operating profit using variable (direct) costing, operating profit falls by $8,000. If manufacturing fixed costs were $80,000 and budgeted production units were 2,000 units, what happened to inventory of finished goods during the period?",
    choices: [
      { key: 'A', text: 'Decreased by 150 units' },
      { key: 'B', text: 'Increased by 150 units.' },
      { key: 'C', text: 'Increased by 200 units.' },
      { key: 'D', text: 'Decreased by 50 units' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 9,
    stem: "A textile manufacturing company has the following information for its service departments, IT and Payroll department, and its production departments, Knitting and Sewing.\n\nIT Overhead cost: $20,000, Payroll Overhead cost: $24,000, Knitting Overhead cost: $22,000, Sewing Overhead cost: $20,000\nService provided by IT: Payroll 30%, Knitting 30%, Sewing 40%\nService provided by Payroll: IT 25%, Knitting 30%, Sewing 45%\n\nUsing the step-down method of shared services cost allocation, how much is to be allocated from Payroll to Sewing? (Round to the nearest dollar.)",
    choices: [
      { key: 'A', text: '$10,411' },
      { key: 'B', text: '$12,840' },
      { key: 'C', text: '$9,630' },
      { key: 'D', text: '$18,000' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 10,
    stem: "A textile manufacturing company has the following information for its service departments, IT and Payroll department, and its production departments, Knitting and Sewing.\n\nIT Overhead cost: $20,000, Payroll Overhead cost: $24,200, Knitting Overhead cost: $22,000, Sewing Overhead cost: $20,000\nService provided by IT: Payroll 30%, Knitting 30%, Sewing 40%\nService provided by Payroll: IT 25%, Knitting 30%, Sewing 45%\n\nUsing the reciprocal method of shared services cost allocation, how much is the total overhead cost for Knitting for the period? (Round to the nearest dollar.)",
    choices: [
      { key: 'A', text: '$30,876' },
      { key: 'B', text: '$30,760' },
      { key: 'C', text: '$40,243' },
      { key: 'D', text: '$27,360' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 11,
    stem: "Victory Company manufactures a variety of products. Champion had been using a traditional overhead allocation system based on machine hours. For the current year, Champion decided to use an activity-based costing system using machine hours and the number of inspections as measures of activity. Information on these measures of activity and related overhead rates for the current year is as follows:\n\nMachine hours: Estimated Activity 50,000, Predetermined Overhead Rate for ABC $20 per machine hour\nQuality control (number of inspections): Estimated Activity 4,000, Predetermined Overhead Rate for ABC $40 per inspection\n\nJob CC-2 required 15 machine hours and 2 inspections. In comparing ABC with traditional costing, under which costing system would more overhead costs be allocated to Job CC-2, and by how much?",
    choices: [
      { key: 'A', text: 'Traditional by $455.00' },
      { key: 'B', text: 'ABC by $32.00' },
      { key: 'C', text: 'ABC by $38.50' },
      { key: 'D', text: 'Traditional by $31.50' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 12,
    stem: "For all of the benefits of using standard costing there are some limitations to its use. All of the following statements are true concerning limitations of standard costing except",
    choices: [
      { key: 'A', text: 'The use of standard costing could lead to overemphasis on quantitative measures.' },
      { key: 'B', text: 'The less standardized the process, the less useful standard costs become.' },
      { key: 'C', text: "The standards can be based only on a division's own cost." },
      { key: 'D', text: 'It may be difficult to determine an accurate standard cost, particularly if the business environment is constantly changing' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 13,
    stem: "Beautiful Flooring manufactures wood flooring panels through three sequential departments: Cutting, Laminating, and Finishing. During April, the Laminating Department received 8,000 units from the Cutting Department with a total transferred-in cost of $64,000. During the month, 6,000 units were completed and transferred to the Finishing Department, 1,500 units remained in ending work-in-process inventory (60% complete for conversion), and 500 units were spoiled. Spoilage is considered normal and is detected at the end of the process.\n\nHow should the Laminating Department account for the $64,000 in transferred-in costs?",
    choices: [
      { key: 'A', text: 'Allocate all $64,000 of transferred-in costs to the 6,000 units transferred out to Finishing.' },
      { key: 'B', text: 'Expense the portion of transferred-in costs assigned to spoiled units as a loss.' },
      { key: 'C', text: 'Allocate the $64,000 of transferred-in costs between ending work-in-process inventory in the Laminating Department and units completed and transferred out to Finishing on the basis of equivalent units, adding the costs associated with the normally spoiled units to the costs of the good, completed units in the cost allocation.' },
      { key: 'D', text: 'Allocate the $64,000 less the cost of the spoiled units to the 6,000 transferred out units and the 1,500 ending inventory units.' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 14,
    stem: "Datson Company manufactures three main products M, P, and Q from a joint process. Joint costs are allocated on the basis of relative sales value at split-off. Additional information for June production activity follows:\n\nUnits produced: M 50,000, P 40,000, Q 10,000, Total 100,000\nJoint costs: Total $450,000\nSales value at split-off: M $420,000, P $270,000, Q $60,000, Total $750,000\nAdditional costs if processed further: M $88,000, P $30,000, Q $12,000, Total $130,000\nSales value if processed further: M $538,000, P $320,000, Q $78,000, Total $936,000\n\nAssuming that the 10,000 units of Q were processed further and sold for $78,000, what was Ashwood's gross profit on this sale?",
    choices: [
      { key: 'A', text: '$21,000' },
      { key: 'B', text: '$36,000' },
      { key: 'C', text: '$28,500' },
      { key: 'D', text: '$30,000' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 15,
    stem: "A company implemented a benchmarking program to compare itself to others in the industry. Through this program, the company management team discovered that a larger competitor has a lower overhead per unit sold. Based on this information, management concluded that steps must be taken to reduce overhead to remain competitive. Which one of the following is the best critique of this conclusion?",
    choices: [
      { key: 'A', text: 'Cost per unit is just one area of competitiveness; others should be looked at.' },
      { key: 'B', text: 'Companies operate very differently, and comparisons should not be made.' },
      { key: 'C', text: 'Fixed overhead is difficult to control and should not be benchmarked.' },
      { key: 'D', text: 'Benchmarking should be performed with companies of similar size and sales.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 16,
    stem: "A corporation's results for the past year are shown below.\n\nCost of goods available for sale $136,000\nEnding balance, raw material inventory 6,000\nEnding balance, work-in-process inventory 14,000\nEnding balance, finished goods inventory 13,000\nManufacturing overhead applied 52,000\nActual manufacturing overhead 55,000\n\nIf the corporation prorates any overapplied or underapplied overhead at the end of the year, cost of goods sold after proration would total",
    choices: [
      { key: 'A', text: '$127,100' },
      { key: 'B', text: '$118,900' },
      { key: 'C', text: '$140,150' },
      { key: 'D', text: '$125,460' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 17,
    stem: "A Johnson and Martin manufacturer has the following unit costs for the month of June:\n\nVariable manufacturing cost $5.00\nVariable marketing cost $3.50\nFixed manufacturing cost $2.00\nFixed marketing cost $4.00\n\nA total of 100,000 units were manufactured during June, 10,000 of which remain in ending inventory. The manufacturer uses the first-in, first-out (FIFO) inventory method, and the 12,000 units are the only finished goods inventory at month end. Using the full absorption costing method, the manufacturer's finished goods inventory value would be",
    choices: [
      { key: 'A', text: '$70,000' },
      { key: 'B', text: '$84,000' },
      { key: 'C', text: '$85,000' },
      { key: 'D', text: '$50,000' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 18,
    stem: "A manufacturer of high-technology consumer goods incurred the following quality-related expenses last year.\n\nEquipment maintenance $8,000\nSpoilage 10,000\nLiability claims 50,000\nSupplier evaluations 6,000\nScrap 20,000\nCustomer support 50,000\nFinished product testing 25,000\n\nWhat is the total cost related to prevention?",
    choices: [
      { key: 'A', text: '$10,000' },
      { key: 'B', text: '$5,000' },
      { key: 'C', text: '$14,000' },
      { key: 'D', text: '$165,000' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 19,
    stem: "A company applies factory overhead based upon machine hours. At the beginning of the year, the company budgeted factory overhead at $248,000 and estimated that 100,000 machine hours would be used to make 50,000 units of product. During the year, the company produced 48,000 units using 97,000 machine hours. Actual overhead for the year was $252,000. Under a standard cost system, the amount of factory overhead applied during the year was",
    choices: [
      { key: 'A', text: '$242,500' },
      { key: 'B', text: '$240,000' },
      { key: 'C', text: '$252,000' },
      { key: 'D', text: '$238,080' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 20,
    stem: "Mariton, Inc., processes chickens for distribution to major grocery chains. The two major products resulting from the production process are white breast meat and legs. Joint costs of $800,000 are incurred during standard production runs each month, which produce a total of 100,000 pounds of white breast meat and 50,000 pounds of legs. Each pound of white breast meat sells for $2, and each pound of legs sells for $1. If there are no further processing costs incurred after the split-off point, what amount of the joint costs would be allocated to the white breast meat on a relative sales value basis?",
    choices: [
      { key: 'A', text: '$480,000' },
      { key: 'B', text: '$200,000' },
      { key: 'C', text: '$640,000' },
      { key: 'D', text: '$400,000' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 21,
    stem: "A company produces disk brakes for mountain bikes. During the current reporting period, the company has normal spoilage of 700 units. At the beginning of the current reporting period, the company had 3,400 units in inventory and started and completed 5,800 units. 4,800 units were transferred out, and ending inventory had 3,200 units. In this reporting period, the abnormal spoilage for the company disk brakes production was",
    choices: [
      { key: 'A', text: '300 units.' },
      { key: 'B', text: '5,200 units.' },
      { key: 'C', text: '400 units.' },
      { key: 'D', text: '500 units.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 22,
    stem: "A company produces two main products and a by-product out of a joint process. The ratio of output quantities to input quantities of direct material used in the joint process remains consistent from month to month. The company has employed the physical-volume method to allocate joint production costs to the two main products. The net realizable value of the by-product is used to reduce the joint production costs before the joint costs are allocated to the main products. Data regarding the company's operations for the current month are presented in the chart below. During the month, the company incurred joint production costs of $2,620,000. The main products are not marketable at the split-off point and, thus, have to be processed further.\n\nFirst Main Product: Monthly output 90,000 pounds, Selling price $30/pound, Separable process costs $560,000\nSecond Main Product: Monthly output 160,000 pounds, Selling price $14/pound, Separable process costs $660,000\nBy-product: Monthly output 60,000 pounds, Selling price $2/pound\n\nThe amount of joint production cost that the company would allocate to the Second Main Product by using the physical-volume method to allocate joint production costs would be",
    choices: [
      { key: 'A', text: '$1,575,000' },
      { key: 'B', text: '$1,600,000' },
      { key: 'C', text: '$1,260,000' },
      { key: 'D', text: '$1,500,000' },
    ],
    correctKey: 'B',
  },
];

// Verified answer key
const answerKey = { 1:'D',2:'D',3:'D',4:'A',5:'D',6:'D',7:'B',8:'C',9:'D',10:'C',11:'B',12:'C',13:'C',14:'D',15:'D',16:'D',17:'B',18:'C',19:'D',20:'C',21:'D',22:'B' };

// Sanity check: verify correctKey matches answer key
questions.forEach((q) => {
  if (q.correctKey !== answerKey[q.qNum]) {
    console.error(`MISMATCH Q${q.qNum}: script has ${q.correctKey}, answer key has ${answerKey[q.qNum]}`);
    process.exit(1);
  }
});

// Build and output SQL INSERT statements
questions.forEach((q) => {
  const position = POSITION_OFFSET + q.qNum; // 103..124

  // Build choices JSON array — escape any single quotes in text for SQL
  const choicesArr = q.choices.map((c) => ({ key: c.key, text: c.text }));
  const choicesJson = JSON.stringify(choicesArr);
  // Escape single quotes inside the JSON string for embedding in SQL literal
  const choicesEscaped = choicesJson.replace(/'/g, "''");

  const metadataJson = JSON.stringify({ source: 'elance', section: 'D' });

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
