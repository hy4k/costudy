// insert-section-e.js
// Generates SQL INSERT statements for CMA Part 1 Section E questions
// exam_id = '7e48129a-35ae-41a2-9cb8-8bb3f7227578'
// section_id = 'cma_p1_e'
// positions: 125-153

const EXAM_ID = '7e48129a-35ae-41a2-9cb8-8bb3f7227578';
const SECTION_ID = 'cma_p1_e';
const TOPIC = 'Internal Controls';
const POSITION_OFFSET = 124; // positions start at 125

function esc(str) {
  return str.replace(/'/g, "''");
}

const questions = [
  {
    qNum: 1,
    stem: "Which of the following is not a purpose of systems development life cycle (SDLC) controls?",
    choices: [
      { key: 'A', text: 'Preventing processing errors in a new system.' },
      { key: 'B', text: 'Providing for the security of the new system.' },
      { key: 'C', text: 'Ensuring that all changes are properly authorized.' },
      { key: 'D', text: 'Enabling programmers to test program changes using live data.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 2,
    stem: "Benefits of having and following a documented record retention or records management policy include all of the following with the exception of:",
    choices: [
      { key: 'A', text: 'The organization\'s compliance with all federal, state, and local regulations regarding document and data retention and destruction will be ensured.' },
      { key: 'B', text: 'Records that are no longer of value will be destroyed at the appropriate time.' },
      { key: 'C', text: 'Accessibility of records will be maintained.' },
      { key: 'D', text: 'Records will be protected.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 3,
    stem: "The purpose of internal control is to",
    choices: [
      { key: 'A', text: 'preserve the tone at the top.' },
      { key: 'B', text: 'provide a guarantee that fraud will not occur.' },
      { key: 'C', text: 'help the company achieve its objectives.' },
      { key: 'D', text: 'prevent errors and omissions.' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 4,
    stem: "The primary responsibility for maintaining a system of internal controls rests with the company's",
    choices: [
      { key: 'A', text: 'Management' },
      { key: 'B', text: 'Accountants.' },
      { key: 'C', text: 'internal auditors.' },
      { key: 'D', text: 'Lawyers.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 5,
    stem: "Which of the following is not a preventive control?",
    choices: [
      { key: 'A', text: 'Customer numbers are verified by the computer before a sales order is accepted to ensure the sales order is from an established company.' },
      { key: 'B', text: 'Following payment, all invoices are marked \"Paid\" to prevent duplicate payment.' },
      { key: 'C', text: 'The accounts receivable subsidiary ledger is reconciled against the general ledger accounts receivable control total.' },
      { key: 'D', text: 'Duties are segregated to make it difficult for an employee to both perpetrate and conceal a fraud.' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 6,
    stem: "To avoid potential errors and irregularities, a well-designed system of internal accounting control in the accounts payable area should include segregation of which of the following functions from each other?",
    choices: [
      { key: 'A', text: 'Check signing and cancellation of payment documentation.' },
      { key: 'B', text: 'Vendor invoice verification and merchandise ordering' },
      { key: 'C', text: 'Physical handling of merchandise received and preparation of receiving reports.' },
      { key: 'D', text: 'Cash disbursements and vendor invoice verification.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 7,
    stem: "Which of the following control procedures may prevent the failure to bill customers for some shipments?",
    choices: [
      { key: 'A', text: 'Each shipment should be supported by a pre-numbered sales invoice that is accounted for.' },
      { key: 'B', text: 'Each sales invoice should be supported by a shipping document.' },
      { key: 'C', text: 'Each sales order should be approved by authorized personnel.' },
      { key: 'D', text: 'Sales journal entries should be reconciled to daily sales summaries.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 8,
    stem: "Which of the following is not a part of the control environment of a publicly traded company?",
    choices: [
      { key: 'A', text: 'The structure of the organization and its reporting process.' },
      { key: 'B', text: 'The manner in which authority and responsibility are assigned.' },
      { key: 'C', text: 'The vacation policy and scheduling of vacations in the delivery department.' },
      { key: 'D', text: 'The policies regarding the employment and retention of staff.' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 9,
    stem: "The control objective that reduces the probability of a fictitious transaction being recorded in the accounting records is:",
    choices: [
      { key: 'A', text: 'Validity.' },
      { key: 'B', text: 'Accuracy.' },
      { key: 'C', text: 'Authorization.' },
      { key: 'D', text: 'Completeness.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 10,
    stem: "When remediating a material weakness in internal controls, which of the following procedures is the most critical to ensure the effectiveness of the remediation project?",
    choices: [
      { key: 'A', text: 'Perform re-performance testing on all financial transactions to verify accuracy.' },
      { key: 'B', text: 'Increase the frequency of internal audits to monthly to ensure continuous oversight of controls.' },
      { key: 'C', text: 'Replace the existing internal control software with a more advanced system to prevent future weaknesses.' },
      { key: 'D', text: 'Create and execute a detailed remediation plan that includes root cause analysis, tasks, responsible persons, deadlines, and monitoring of progress in implementing the plan.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 11,
    stem: "Which of the following statements about the Foreign Corrupt Practices Act (FCPA) is not correct?",
    choices: [
      { key: 'A', text: 'The FCPA contains provisions concerning anti-bribery and accounting issues' },
      { key: 'B', text: 'The FCPA prohibits U.S. companies from making payments (or giving anything of value) to officers of foreign companies in order to obtain or retain business' },
      { key: 'C', text: 'A bribe does not actually have to be paid for a violation to occur under the FCPA' },
      { key: 'D', text: '"Grease payments" are allowed under the FCPA' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 12,
    stem: "What is the best definition of \"tone at the top\" as it pertains to internal auditing, corporate governance, and management philosophy?",
    choices: [
      { key: 'A', text: 'Tone at the top represents the actions undertaken by management to establish ethics and the importance of operating in an ethical manner.' },
      { key: 'B', text: 'Tone at the top means that the management team has established an ethics hotline and reporting policy to report possible unethical behavior' },
      { key: 'C', text: 'Tone at the top is under the purview of external auditors and consultants recommending actions and policies; therefore, it is not the responsibility of management.' },
      { key: 'D', text: 'Tone at the top is fulfilled and demonstrated by the implementation of training led by external experts and consultants.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 13,
    stem: "Which of the following situations would indicate strong corporate governance?\n\nI. The company has a Code of Ethics and it provides periodic ethics training to its employees.\nII. The positions of Board Chair and CEO are held by the same person.\nIII. A majority of the non-executive directors are former employees.\nIV. The Chair of the audit committee is the former CFO, who retired 6 months ago.\nV. A majority of the board members are outside directors not employed by the company.",
    choices: [
      { key: 'A', text: 'I only' },
      { key: 'B', text: 'I, II, III and IV only.' },
      { key: 'C', text: 'I and V only' },
      { key: 'D', text: 'All of the above' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 14,
    stem: "It is management's responsibility to make sure risk management and control processes are established and operating as intended. The purpose of these two processes is so people in the organization are better able to manage risks and so they understand what the objectives of the organization are. Control processes should provide reasonable assurance that objectives of the company relating to which of the following will be achieved?\n\nI. Resources are used effectively and efficiently, the company's business objectives are being achieved, and assets are safeguarded.\nII. Reporting is reliable and timely and meets all requirements both internal and external.\nIII. The actions and decisions of the organization are in compliance with laws, regulations, and contracts.\nIV. Management's plans have not been circumvented by worker collusion.",
    choices: [
      { key: 'A', text: 'I and II only.' },
      { key: 'B', text: 'I, II, III and IV.' },
      { key: 'C', text: 'II, III and IV only.' },
      { key: 'D', text: 'I, II, and III only.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 15,
    stem: "Regularly performed reconciliations are an example of what type of internal control?",
    choices: [
      { key: 'A', text: 'A detective control.' },
      { key: 'B', text: 'A preventive control.' },
      { key: 'C', text: 'A corrective control.' },
      { key: 'D', text: 'A feedforward control.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 16,
    stem: "The segregation of duties is an important control objective. Which of the following does not violate that objective?",
    choices: [
      { key: 'A', text: 'Signing of checks and custody of signature stamp.' },
      { key: 'B', text: 'Purchase requisition request and purchase order authorization.' },
      { key: 'C', text: 'Credit approval and write-off of credit losses.' },
      { key: 'D', text: 'All of the above violate the segregation of duties.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 17,
    stem: "The warehouse department receives notice from a sales clerk that an item in stock was sold. The sales clerk indicates to the warehouse which item was sold and verifies the quantity. The warehouse pulls the item from inventory and sends it to the shipping department. The shipping department prepares the packing slip and prepares the item for shipment. The shipping clerk enters data on the item shipped. The shipping documentation is sent to general accounting after shipping so the shipment can be invoiced. Which of the following areas is a control weakness of the organization?\n\nI. Notice of sale to the warehouse by the sales clerk.\nII. Verification by the sales clerk to the warehouse of the quantity.\nIII. Preparation of packing slip by the shipping department.\nIV. Sending the shipping documentation to accounting after the shipping takes place.",
    choices: [
      { key: 'A', text: 'I, II, and III only.' },
      { key: 'B', text: 'I only.' },
      { key: 'C', text: 'II and III only.' },
      { key: 'D', text: 'All of the above.' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 18,
    stem: "The purpose of the internal controls provision of the Foreign Corrupt Practices Act is to",
    choices: [
      { key: 'A', text: 'Deter management from making payments that are prohibited by the Act' },
      { key: 'B', text: 'Prevent collusion between and among employees' },
      { key: 'C', text: 'Guarantee accurate financial reporting' },
      { key: 'D', text: 'Protect investors' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 19,
    stem: "The internal controls provisions of the Foreign Corrupt Practices Act apply to companies that are publicly traded only. The anti-bribery provisions of the FCPA apply to",
    choices: [
      { key: 'A', text: 'All companies, regardless of whether they are privately held or publicly held.' },
      { key: 'B', text: 'Publicly held firms that report to the U.S. SEC only.' },
      { key: 'C', text: 'All firms that report to the U.S. SEC, whether they are privately held or publicly held.' },
      { key: 'D', text: 'Publicly held firms with $75 million or more in public float (the value of shares held by the public) only.' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 20,
    stem: "The effectiveness of an internal control system depends on",
    choices: [
      { key: 'A', text: 'whether or not the controls have been tested.' },
      { key: 'B', text: 'the ethics of the people performing the controls.' },
      { key: 'C', text: 'the design of the system and whether the controls are operating as designed.' },
      { key: 'D', text: 'the support of management.' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 21,
    stem: "Which of the following is the correct order for prioritizing the remediation of internal control deficiencies identified during testing the adequacy of internal controls?",
    choices: [
      { key: 'A', text: 'Control deficiencies, material weaknesses, significant deficiencies' },
      { key: 'B', text: 'Material weaknesses, significant deficiencies, control deficiencies' },
      { key: 'C', text: 'Material weaknesses, control deficiencies, significant deficiencies' },
      { key: 'D', text: 'Significant deficiencies, control deficiencies, material weaknesses' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 22,
    stem: "Can internal controls pose a risk to organizational efficiency, even if they are developed and tested internally by management and the internal audit function",
    choices: [
      { key: 'A', text: 'No, if the internal controls are developed and tested by the internal audit function there is no risk of them causing efficiency issues.' },
      { key: 'B', text: 'Yes, controls developed internally will almost always negatively impact efficiency, because even though internal controls can help organizations, they make the processes more time consuming which negatively impacts organizational efficiency' },
      { key: 'C', text: 'Yes, there is always a risk that internal controls could negatively impact operational efficiency, even if they are developed by management and the internal audit function' },
      { key: 'D', text: 'No, controls do not hinder operational efficiency because being efficient is the most important aspect for organizations in the current environment' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 23,
    stem: "Which of the following statements concerning firewalls is not correct?",
    choices: [
      { key: 'A', text: 'A firewall can consist of software, hardware, or both.' },
      { key: 'B', text: 'A firewall performs the same basic tasks as antivirus software' },
      { key: 'C', text: 'Firewalls help protect an organization\'s network from external threats such as hackers and viruses' },
      { key: 'D', text: 'Firewalls help protect an organization by preventing employees from accessing certain websites while at work' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 24,
    stem: "Which one of the following is not an example of data encryption?",
    choices: [
      { key: 'A', text: 'Using a password to protect documents before sending out' },
      { key: 'B', text: 'Asking for a digital signature when signing contracts over the internet' },
      { key: 'C', text: 'An internet browser enabling secure certificates when communicating with websites.' },
      { key: 'D', text: 'Masking input characters in the password fields automatically' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 25,
    stem: "Which of the following statements concerning disaster recovery planning is not correct?",
    choices: [
      { key: 'A', text: 'A "hot site" is more expensive to set up and maintain than is a "cold site."' },
      { key: 'B', text: 'A company would take longer to continue operations after a natural disaster if it had a "warm site" than if it had a hot site' },
      { key: 'C', text: 'The main difference between a warm site and a cold site is that the computers in a warm site are fully configured while the computers in a cold site are not yet configured.' },
      { key: 'D', text: 'A company would be able to continue operations after a natural disaster sooner if it had a warm site than if it had a cold site' },
    ],
    correctKey: 'C',
  },
  {
    qNum: 26,
    stem: "Which of the following risks can be minimized by requiring all employees accessing the information systems to use passwords",
    choices: [
      { key: 'A', text: 'Collusion' },
      { key: 'B', text: 'Data entry errors' },
      { key: 'C', text: 'Failure of server duplicating function' },
      { key: 'D', text: 'Firewall vulnerability' },
    ],
    correctKey: 'D',
  },
  {
    qNum: 27,
    stem: "Which of the following statements is the most accurate definition of phishing?",
    choices: [
      { key: 'A', text: 'The acts that an organization takes to mitigate the risk of social engineering attacks such as establishing various system controls and training employees' },
      { key: 'B', text: 'Links or attachments to general emails that inadvertently allow malicious software into the organization.' },
      { key: 'C', text: 'Links or attachments to highly customized emails that inadvertently allow malicious software into the organization' },
      { key: 'D', text: 'Outside individuals posing as employees to obtain confidential and organizational information via deceptive actions' },
    ],
    correctKey: 'B',
  },
  {
    qNum: 28,
    stem: "A bank has identified that its critical business processes, including account management, trade, and remittance, cannot be disrupted in case of a disaster. Hence, it wanted an alternative site that syncs with the production environment to ensure negligible impact and to reduce downtime to the minimum. Which of the disaster recovery facilities is best suited for this situation?",
    choices: [
      { key: 'A', text: 'Hot site' },
      { key: 'B', text: 'Warm site' },
      { key: 'C', text: 'Cold site' },
      { key: 'D', text: 'Backup site' },
    ],
    correctKey: 'A',
  },
  {
    qNum: 29,
    stem: "Which of the following is not an example of an input control in an accounting information system?",
    choices: [
      { key: 'A', text: 'Requiring that certain data fields contain only numerical values' },
      { key: 'B', text: 'Automating as much processing in an accounting information system as possible' },
      { key: 'C', text: 'A manager confirming order details before they are entered into an accounting information system' },
      { key: 'D', text: 'Redesigning a credit application form to make it easier to understand.' },
    ],
    correctKey: 'B',
  },
];

// Build and output SQL INSERT statements
questions.forEach((q) => {
  const position = POSITION_OFFSET + q.qNum; // 125..153

  // Build choices JSON array — escape any single quotes in text for SQL
  const choicesArr = q.choices.map((c) => ({ key: c.key, text: c.text }));
  const choicesJson = JSON.stringify(choicesArr);
  // Escape single quotes inside the JSON string for embedding in SQL literal
  const choicesEscaped = choicesJson.replace(/'/g, "''");

  const metadataJson = JSON.stringify({ source: 'elance', section: 'E' });

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
