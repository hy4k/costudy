const EXAM_ID = '7e48129a-35ae-41a2-9cb8-8bb3f7227578';
const SECTION_ID = 'cma_p1_a';
const TOPIC = 'External Financial Reporting Decisions';

const answersRaw = `1. D. $0
2. C. Eliminated and are not reported on the consolidated balance sheet.
3. B. $20,000
4. B. $9,000
5. B. $35,500
6. C. $17,000
7. C. An asset's service potential declines with use.
8. B. Investments in systems, data collection, and analysis will yield positive long-term results.
9. C. $83,420
10. B. It is prohibited.
11. C. $22,000
12. A. $280,000
13. D. Interest expense will increase by a larger amount each year.
14. A. Variable interest entity (VIE) model.
15. D. If the company uses the percentage of accounts receivable method, the charge would be $29,000.
16. C. Capitalize all costs with the exception of the painting because it represents maintenance expense.
17. A. Each reporting unit.
18. B. Identification of dependencies.
19. C. Recognizes the same amount for the right-of-use asset and the lease liability under a finance lease and an operating lease
20. A. $23,709
21. A. In Years 2 and 3.
22. D. Record $500,000 as a loss contingency.
23. C. Items included in the determination of taxable income may be presented in different sections of the financial statements.
24. B. $1,945,000
25. C. The goods should be included in ending inventory of the consignor.
26. D. $168,000
27. D. $160,000
28. A. $80,000
29. C. A change from FIFO to weighted-average inventory valuation when costs are falling.
30. C. LIFO, because the operating income will be $4,360 lower than FIFO.`;

const answers = {};
for (const line of answersRaw.trim().split('\n')) {
  const m = line.match(/^(\d+)\.\s+([A-D])\./);
  if (m) answers[parseInt(m[1])] = m[2];
}

const questionsRaw = `A company is the plaintiff in two lawsuits. The first suit involves a competitor who has made an exact copy of one of the company's products, and the company is suing for patent infringement. The attorneys estimate a $5,000,000 award for the company; however, it is anticipated that the case will be in litigation for 2 to 3 years before final resolution. The second case also involves patent infringement; however, in this instance, the attorneys do not believe the company has a strong case. It is estimated that the company has a 50% chance of winning and the award, if any, would be in the $250,000 to $1,000,000 range. The most appropriate amount to be recorded as a gain contingency is

A. $5,000,000
B. $5,250,000
C. $5,125,000
D. $0
---
Company Mousy has a 60% ownership interest in Kaiz Company. Mousy's separate balance sheet reports a $140,000 receivable from Kaiz and a $72,500 payable to Kaiz. When Mousy prepares its consolidated financial statement, the balances of the receivable and the payable will be

A. Reported on the consolidated balance sheet in proportion to the ownership interest of 60%.
B. Reported at their full amount on the consolidated balance sheet, $140,000 receivable and $72,500 payable.
C. Eliminated and are not reported on the consolidated balance sheet.
D. Netted, and Mousy will show a related company net receivable of $67,500.
---
Data pertaining to Catus Co.'s long-term construction jobs, which commenced during Year 1, are as follows:\\n\\nProject 1 Project 2\\nContract price $420,000 $300,000\\nCosts incurred during Year 1 240,000 280,000\\nEstimated costs to complete 120,000 40,000\\nBilled to customers during Year1 150,000 270,000\\nReceived from customers during Year 1 90,000 250,000\\n\\nIf Catus uses the input method based on costs incurred to measure the progress toward completion of the project, what amount of gross profit (loss) should Catus report in its Year 1 income statement?

A. $(20,000)
B. $20,000
C. $40,000
D. $22,500
---
On January 1, Evangel Company issued 9% bonds in the face amount of $100,000, which mature in 5 years. The bonds were issued for $96,207 to yield 10%, resulting in a bond discount of $3,793. Evangel uses the effective interest method of amortizing bond discount. Interest is payable annually on December 31.\\n\\nWhat is the amount of interest Evangel will pay at the end of the first year?

A. $10,000
B. $9,000
C. $8,659
D. $9,621
---
A manufacturing company's machine has a historical cost of $360,000. At the end of the current fiscal year, accumulated depreciation equals $149,500. As a result of low demand for the company's products, management concludes that the carrying amount of the machine may not be recoverable. Management estimates that the undiscounted future cash flows over the remaining useful life of the machine will be $190,000. At the end of the fiscal year, the machine's estimated fair value is $175,000. The company prepares its financial statements in accordance with U.S. GAAP. What is the impairment loss, if any, that the company should recognize in the income statement for the current fiscal year?

A. $210,500
B. $35,500
C. $185,000
D. $20,500
---
On April 1, a corporation began offering a new product for sale under a standard 1-year assurance-type warranty. Of the 5,000 units in inventory at April 1, 3,000 had been sold by June 30. Based on its experience with similar products, the corporation estimated that the average warranty cost per unit sold would be $8. Actual warranty costs incurred from April 1 through June 30 were $7,000. At June 30, what amount should the corporation report as estimated warranty liability?

A. $33,000
B. $16,000
C. $17,000
D. $9,000
---
In which of the following situations is the units-of-production method of depreciation most appropriate?

A. An asset incurs increasing repairs and maintenance with use.
B. An asset's service potential declines with the passage of time.
C. An asset's service potential declines with use.
D. An asset is subject to rapid obsolescence.
---
The most persuasive argument for adoption of integrated reporting (IR) is that

A. Worldwide adoption is likely because the percentage of companies using integrated reporting is already high.
B. Investments in systems, data collection, and analysis will yield positive long-term results.
C. A global institute exists that issues universally accepted standards for integrated reporting.
D. Disclosure of accurate but sometimes negative information will have negligible costs.
---
The board of directors of a corporation authorized the president of the corporation to pay as much as $90,000 to purchase a tract of land adjacent to the main factory. The president negotiated a price of $75,800 for the land, and legal fees for closing costs amounted to $820. A contractor cleared, filled, and graded the land for $6,800, and dug the foundation for a new building for $4,300. A prefabricated building was erected at a cost of $181,000. The building has an estimated useful life of 20 years with no residual value. The contractor's bill indicated that the cost of the parking lot and driveways was $7,060. The parking lot and the driveways will need to be replaced in 15 years. The proper amount to be recorded in the corporation's land account is

A. $87,720
B. $76,620
C. $83,420
D. $90,480
---
After an impairment loss is recognized, the adjusted carrying amount of the intangible asset shall be its new accounting basis. Which of the following statements about subsequent reversal of a previously recognized impairment loss is correct?

A. It must be disclosed in the notes to the financial statements.
B. It is prohibited.
C. It is encouraged but not required.
D. It is required when the reversal is considered permanent.
---
Mexico Co. determined that the net realizable value (NRV) of its accounts receivable at December 31, based on an aging of the receivables, was $650,000. Additional information is as follows:\\n\\nAllowance for credit losses -- 1/1 $ 60,000\\nCredit losses on accounts written off during the year 36,000\\nCredit losses on accounts recovered during the year 4,000\\nAccounts receivable at 12/31 700,000\\n\\nWhat is Mexico's credit loss expense for the year?

A. $30,000
B. $10,000
C. $22,000
D. $42,000
---
An entity purchased a machine for $700,000. The machine was depreciated using the straight-line method and had a residual value of $40,000. The machine was sold on December 31, Year 1. The accumulated depreciation related to the machine was $495,000 on that date. The entity reported a gain on the sale of the machine of $75,000 in its income statement for the fiscal year ending December 31, Year 1. The selling price of the machine was

A. $280,000
B. $115,000
C. $240,000
D. $205,000
---
Which of the following statements describes the relationship of interest expense related to bonds payable when a discount on bonds payable has been recorded using the effective interest method?

A. Interest expense will be the same each year.
B. Interest expense will increase by the same amount each year.
C. Interest expense will decrease each year.
D. Interest expense will increase by a larger amount each year.
---
Company X is a publicly-traded U.S. company. Under U.S. GAAP, the company is required to prepare consolidated financial statements with Company Y. Company X does not have a more than 50% ownership interest in Company Y but does have the power to direct its activities. The consolidation accounting used is the

A. Variable interest entity (VIE) model.
B. Equity consolidation model.
C. Voting interest entity (VOE) model.
D. Proportionate consolidation model.
---
A company had the following account balances at December 31:\\n\\nAccounts receivable $ 900,000\\nAllowance for credit losses (before any provision for the year credit loss expense) 16,000\\nCredit sales for the year 1,750,000\\n\\nThe company is considering the following methods of estimating credit loss expense for the year:\\nBased on credit sales at 2%\\nBased on accounts receivable at 5%\\n\\nWhich one of the following statements with regard to the charge to credit loss expense is correct?

A. If the company uses the percentage of credit sales method, the charge would be $19,000.
B. If the company uses the percentage of credit sales method, the charge would be $51,000.
C. If the company uses the percentage of accounts receivable method, the charge would be $45,000.
D. If the company uses the percentage of accounts receivable method, the charge would be $29,000.
---
An entity has owned its present facilities since 1981, and the CEO has authorized various expenditures to repair and improve the building during the current year. The building was beginning to sag, and without repair, it would only last another 8 years. To correct the problem, the foundation was reinforced and several columns were added in the basement area at a cost of $47,200. As a result, engineers estimate that the building will have a remaining useful life of 20 years. To install a new local area network (LAN) and be ready for the next generation of computers, the phone lines and electrical systems were updated at a cost of $81,300. The entity's engineers estimate that these improvements should last 25 years. The offices and open work spaces were rearranged to reduce exposure to electronic emissions at a materials cost of $31,000. The purchase and installation of the computers and software for the LAN cost $102,700. The LAN hardware and software will have to be replaced in 6 years, but further rearrangement of the offices and work spaces will not be necessary. After these improvements were completed, the entire building was painted inside and outside at a cost of $9,450.\\n\\nAs controller of the entity, which one of the following actions would you recommend to be in conformity with generally accepted accounting principles?

A. Capitalize all expenditures because they represent additions, improvements, and rearrangements.
B. Capitalize all costs with the exception of the upgrade to the phone and electrical systems and the painting because they represent maintenance expenses.
C. Capitalize all costs with the exception of the painting because it represents maintenance expense.
D. Treat all expenditures as expenses in the current year except the cost of rearrangement ($31,000), which should be amortized over a period not to exceed 20 years.
---
Goodwill should be tested for value impairment at which of the following levels?

A. Each reporting unit.
B. Entire business as a whole.
C. Each acquisition unit.
D. Each identifiable long-term asset.
---
The <IR> Framework includes Content Elements. The organization's business model is one such element. A description of the business model in the integrated report includes

A. Measurement of achievements.
B. Identification of dependencies.
C. Outputs such as brand loyalty.
D. Sources of specific risks.
---
On January 1, Year 1, Lessee entered into a 4-year lease and did not incur initial direct costs. At the lease commencement date, Lessee

A. Applies different accounting for initial measurement of a right-of-use asset under finance and operating leases.
B. Measures the lease liability at the sum of the present values of the rental payments and the expected residual value of the leased asset.
C. Recognizes the same amount for the right-of-use asset and the lease liability under a finance lease and an operating lease.
D. Must discount the lease payments using the lessor's incremental borrowing rate.
---
On June 1, Greendale Corp. issued $700,000, 5-year bonds at 8%, with interest payable annually on May 31. The bonds sold for $728,700 when the market rate of interest was 7%. Greendale uses the effective interest method for amortizing premiums on bonds payable. What is the balance of the premiums on bonds payable account immediately following the first interest payment?

A. $23,709
B. $33,691
C. $34,440
D. $22,960
---
Kamchatka sells a durable good on January 1, Year 1, and the customer is automatically given a 1-year standard warranty against manufacturing defects. The customer also buys an extended warranty package, extending the coverage for an additional 2 years to the end of Year 3. At the time of the original sale, the company expects warranty costs to be incurred evenly over the life of the warranty contracts. The customer has only one warranty claim during the 3-year period, and the claim occurs during Year 2. The company will recognize revenue from the sale of the extended warranty

A. In Years 2 and 3.
B. On January 1, Year 1.
C. December 31, Year 3, when the warranty expires.
D. At the time of the claim in Year 2.
---
A company is being sued in a wrongful discharge suit for $500,000. The company attorney has advised that the probability of the plaintiff prevailing and receiving the full amount is about 80%. The attorney also indicated that the case would likely be tied up in the courts for 2 to 3 years. The most appropriate financial statement presentation for this loss contingency would be to

A. Disclose the loss contingency in the footnotes.
B. Record $400,000 as a loss contingency.
C. Not record or footnote the loss contingency.
D. Record $500,000 as a loss contingency.
---
Intraperiod income tax allocation arises because

A. Income taxes must be allocated between current and future periods.
B. Certain revenues and expenses appear in the financial statements but are excluded from taxable income.
C. Items included in the determination of taxable income may be presented in different sections of the financial statements.
D. Certain revenues and expenses appear in the financial statements either before or after they are included in taxable income.
---
Pine Co. purchased land for $450,000 as a factory site. An existing building on the site was razed before construction began. Additional information is as follows:\\n\\nCost of razing old building $ 60,000\\nTitle insurance and legal fees to purchase land 30,000\\nArchitect's fees 95,000\\nNew building construction cost 1,850,000\\n\\nWhat amount should Pine capitalize as the cost of the completed factory building?

A. $1,975,000
B. $1,945,000
C. $2,005,000
D. $1,910,000
---
What is the appropriate treatment for goods held on consignment?

A. The goods should be included in ending inventory of the consignee.
B. The goods should be included in cost of goods sold of the consignor when transferred to the consignee.
C. The goods should be included in ending inventory of the consignor.
D. The goods should be included in cost of goods sold of the consignee only when sold.
---
Pretoria Company acquired a new machine at a cost of $400,000 and incurred costs of $4,000 to have the machine shipped to its factory. Pretoria also paid $9,000 to construct and prepare a site for the new machine and $7,000 to install the necessary electrical connections. Pretoria estimates that the useful life of this new machine will be 5 years and that it will have a salvage value of $30,000 at the end of that period. Assuming that Pretoria acquired the machine on January 1 and will take a full year's depreciation, the proper amount of depreciation expense to be recorded by Pretoria if it uses the double-declining-balance method is

A. $161,600
B. $148,000
C. $160,000
D. $168,000
---
The following information applies to a manufacturing company, which has a 6-month operating cycle:\\n\\nCash sales $100,000\\nCredit sales during the sixth month with net 30 days terms 150,000\\nCredit sale during the fifth month with special terms of net 9 months 10,000\\nInterest earned and accrued on an investment that matures during month 3 of the next cycle 2,000\\n\\nThe total of the company's trade accounts receivable at the end of the current cycle is

A. $152,000
B. $260,000
C. $262,000
D. $160,000
---
During the current year, Murdock Company made the following expenditures relating to plant machinery and equipment:\\n\\nRenovation of a group of machines at a cost of $100,000 to secure greater efficiency in production over their remaining 5-year useful lives. The project was completed on December 31.\\nContinuing, frequent, and low-cost repairs at a cost of $70,000.\\nReplacement of a broken gear on a machine at a cost of $10,000.\\n\\nWhat total amount should be charged to repairs and maintenance for the current year?

A. $80,000
B. $70,000
C. $180,000
D. $170,000
---
Which of the following changes in accounting policies resulting from a significant change in the expected pattern of economic benefit will increase profit?

A. A change from accelerated to straight-line depreciation in the later years of the depreciable lives of the assets.
B. A change from straight-line to accelerated depreciation in the early years of the depreciable lives of the assets.
C. A change from FIFO to weighted-average inventory valuation when costs are falling.
D. A change from FIFO to LIFO inventory valuation when costs are rising.
---
A retailer sells antique replica trunks to customers all over the world. The retailer's inventory records show the following:\\n\\nQuantity (units) Cost (each)\\nBeginning inventory 200 $1,055\\nPurchases:\\nJune 3 170 1,062\\nSeptember 18 190 1,070\\nDecember 10 160 1,076\\n\\nThe retailer sells 470 units this year. Management is researching whether the company should use last in, first out (LIFO) or first in, first out (FIFO). If the retailer's management wants to lower the company's income taxes, which inventory cost flow assumption should it select?

A. FIFO, because the operating income will be $840 lower than LIFO.
B. LIFO, because the cost of goods sold will be $5,250 higher than FIFO.
C. LIFO, because the operating income will be $4,360 lower than FIFO.
D. FIFO, because the cost of goods sold will be $9,870 higher than LIFO.`;

// Parse questions
const blocks = questionsRaw.split('\n---\n');
const questions = blocks.map((block, i) => {
  const qNum = i + 1;
  const lines = block.trim().split('\n');

  const choicePattern = /^([A-D])\.\s+(.+)$/;
  let stemLines = [];
  let choices = {};

  for (const line of lines) {
    const cm = line.match(choicePattern);
    if (cm) {
      choices[cm[1]] = cm[2];
    } else {
      stemLines.push(line);
    }
  }

  const stem = stemLines.join('\n').trim();
  const correctKey = answers[qNum] || '?';

  return { qNum, stem, choices, correctKey };
});

// Generate SQL
const values = questions.map((q, i) => {
  const esc = (s) => s.replace(/'/g, "''");
  const choicesJson = JSON.stringify(
    Object.entries(q.choices).map(([k, v]) => ({ key: k, text: v }))
  ).replace(/'/g, "''");

  return `(
    '${EXAM_ID}',
    '${SECTION_ID}',
    '${esc(TOPIC)}',
    '${esc(q.stem)}',
    '${choicesJson}'::jsonb,
    '${q.correctKey}',
    '',
    'medium',
    ${i + 1},
    '{"source": "elance", "section": "A", "original_number": ${q.qNum}}'::jsonb
  )`;
});

const sql = `INSERT INTO public.mcq_questions (exam_id, section_id, topic, stem, choices, correct_key, explanation, difficulty, position, metadata)
VALUES
${values.join(',\n')};`;

console.log(sql);
