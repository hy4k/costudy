import React from 'react';
import { Icons } from '../Icons';
import { ExamConfig } from '../../services/examService';

interface IntroPageProps {
  page: number;
  config: ExamConfig;
  mcqCount: number;
  essayCount: number;
}

// All 16 introduction pages matching Prometric tutorial
export const getIntroPageContent = ({ page, config, mcqCount, essayCount }: IntroPageProps): React.ReactNode => {
  const totalTime = config.mcqDurationMinutes + config.essayDurationMinutes;
  
  switch (page) {
    // Page 1: Exam Structure
    case 1:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 1</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">CMA Exam Simulation</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <h3 className="font-bold text-base">Exam Structure</h3>
            
            <p>
              This CMA Exam Simulation exam has two (2) content sections and you will have {totalTime} minutes 
              to complete both sections of the exam.
            </p>
            
            <div className="space-y-2">
              <p>
                <strong>Content Section 1:</strong> The first (1) content section is multiple-choice and you have 
                {' '}{config.mcqDurationMinutes} minutes to complete this section.
              </p>
              <p>
                <strong>Content Section 2:</strong> The second (2) content section contains {essayCount} essays 
                and related questions and you have {config.essayDurationMinutes} minutes to complete this section. 
                Each essay scenario will be presented as a PDF. Once the PDF is opened, it will remain open to 
                the left of the related questions until you proceed to the second essay scenario.
              </p>
            </div>
            
            <p className="italic text-slate-600">
              Please note that the purpose of this Exam Simulation is to give you a sense of the experience 
              of the exam as it will be in the test center. The simulated exam experience is not indicative 
              of the breadth and depth of the CMA exam content.
            </p>
            
            {config.testType === 'CHALLENGE' && (
              <p className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800">
                <strong>⚠️ Challenge Mode:</strong> You must answer at least {config.mcqPassThreshold}% of the 
                multiple-choice questions correctly to continue to the essay section of the exam.
              </p>
            )}
            
            <p>
              Before you begin, it is strongly recommended that you take a few minutes to review the tutorial 
              before attempting any exam questions. The tutorial provides an overview of the features available 
              to you during the examination.
            </p>
            
            <p className="text-slate-500 text-xs">
              Copyright © 2026 CoStudy
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              To begin the tutorial, click on the "Next" button at the bottom of the screen.
            </p>
          </div>
        </div>
      );
      
    // Page 2: Welcome to Tutorial
    case 2:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 2</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Welcome to the Tutorial</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              This tutorial provides a series of screens that orient you to the computer testing environment. 
              You will be instructed on how to use the mouse and the different parts of the screen.
            </p>
            
            <p>
              Notice the timer at the top of the screen. A similar display will appear during the actual exam. 
              To the left of the screen is a numbered list that shows you where you are in the series of 
              examination questions (or in this case, screens of the tutorial). Other screen features are 
              described later in the tutorial.
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 3: Using the Mouse
    case 3:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 3</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Using the Mouse</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <div className="flex justify-center mb-4">
              <div className="text-6xl cursor-pointer">🖱️</div>
            </div>
            
            <p>
              The mouse pointer moves when you move the mouse around on a surface. Although it can assume 
              different shapes, the arrow shown above is most common. To point with the mouse, move the 
              pointer until it rests on the desired object. To click on an object, point to it and then 
              quickly press and release the left mouse button.
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 4: Navigating Through the Exam
    case 4:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 4</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Navigating Through the Exam</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              Click the <strong>Next</strong> button displayed at the bottom of the screen to move to the 
              next screen or question. Click the <strong>Back</strong> button to move to the previous screen 
              or question.
            </p>
            
            <p className="text-[#8dc63f]">
              In addition to the navigation buttons, you can use the numbered buttons displayed on the left 
              side of the screen. Depending on the number of questions in the section, you may need to click 
              on the down arrow to navigate to additional questions.
            </p>
            
            {/* Visual example of numbered buttons */}
            <div className="flex gap-1 my-4">
              {[26, 27, 28, 29].map((n, i) => (
                <div key={n} className={`w-10 h-8 flex items-center justify-center text-xs font-bold rounded-r ${
                  i === 1 ? 'bg-slate-600 text-white' : 'bg-[#8dc63f] text-white'
                } ${i === 3 ? 'relative' : ''}`}>
                  {n}
                  {i === 3 && <span className="absolute -right-1 top-1/2 -translate-y-1/2">🚩</span>}
                </div>
              ))}
              <div className="w-10 h-8 flex items-center justify-center bg-[#8dc63f] text-white rounded-r">
                <Icons.ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            <p>
              The numbered buttons change appearance to indicate different question states: Current, Attempted, 
              Unattempted, and Flagged.
            </p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The current question will be indicated by an arrow-shaped numbered button.</li>
              <li>For all attempted questions, the numbered button will appear darker in color.</li>
              <li>For all unattempted questions, the numbered button will remain the original color.</li>
              <li>Flagged questions will show a flag icon on the numbered button.</li>
            </ul>
          </div>
        </div>
      );
      
    // Page 5: Using the Scroll Function
    case 5:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 5</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Using the Scroll Function</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              When a question does not fit on a single screen, the following warning will appear at the 
              bottom of the screen.
            </p>
            
            <div className="bg-[#8dc63f] text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 my-4">
              This page requires scrolling ⊗
            </div>
            
            <p>
              To scroll through the screen contents, click and drag the scroll bar as necessary or use 
              the scroll wheel on the mouse.
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 6: Time Remaining
    case 6:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 6</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Time Remaining</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              The amount of time remaining is displayed at the top of the screen.
            </p>
            
            <div className="bg-[#333] text-white px-4 py-3 rounded-lg inline-flex items-center gap-3 my-4">
              <Icons.Clock className="w-5 h-5" />
              <div>
                <div className="text-[10px] text-slate-300 font-bold uppercase">Section Time Remaining</div>
                <div className="font-mono text-lg font-bold">01:59:46</div>
              </div>
            </div>
            
            <p>
              Each section of this examination is allocated a specific amount of time, including the Tutorial. 
              There is also an overall amount of time provided for your full exam appointment. Clicking on the 
              clock will switch between the amount of time remaining in the current section of the exam and the 
              amount of time remaining in all content sections, if applicable.
            </p>
            
            <p className="font-bold">
              The most important time display for you as a test taker is the "Section Time Remaining."
            </p>
            
            <p className="text-amber-600">
              Note that, where applicable, an alert box will appear below the exam clock to signal when 
              30 minutes, 15 minutes, and 5 minutes remain in the current section.
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 7: Flagging Questions
    case 7:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 7</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Flagging Questions</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <div className="flex justify-center mb-4">
              <button className="bg-[#8dc63f] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                <span className="text-xl">🚩</span> Flag
              </button>
            </div>
            
            <p>
              You can flag a question as a reminder to go back and check your answer or attempt it later.
            </p>
            
            <p>
              To flag a question, click the <strong>Flag</strong> button displayed at the bottom of the 
              exam screen.
            </p>
            
            <p>
              Any questions that are flagged for review will show a flag icon on the numbered button, as 
              shown below. Click the <strong>Flag</strong> button again to remove the flag.
            </p>
            
            <div className="flex justify-center my-4">
              <div className="w-12 h-10 bg-[#8dc63f] text-white rounded-r flex items-center justify-center font-bold relative">
                1
                <span className="absolute -right-2 top-0">🚩</span>
              </div>
            </div>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 8: Answering MCQs
    case 8:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 8</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Answering Multiple-Choice Questions</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              This examination uses multiple-choice questions. This type of question has one correct answer.
            </p>
            
            <p>
              To complete each multiple-choice question, click on the option that you believe to be the 
              single best answer. Once selected, the option will appear darker in color. To change your 
              response, click on a different option. If you would like to unselect a chosen option, click 
              on it a second time.
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              Practice answering the multiple-choice question below. Once you have finished practicing, 
              click the 'Next' button to continue.
            </p>
            
            <div className="border border-slate-300 rounded-lg p-4 bg-white mt-4">
              <p className="mb-4 font-medium">
                Of the following biological levels of organization, which represents the smallest or lowest level?
              </p>
              
              <div className="space-y-2">
                {['A', 'B', 'C', 'D'].map((letter, i) => (
                  <div key={letter} className="flex items-center gap-3">
                    <span className="font-bold text-slate-500 w-6">{letter}</span>
                    <div className="flex-1 border border-slate-300 px-4 py-2 rounded hover:bg-slate-50 cursor-pointer">
                      {['population', 'ecosystem', 'organism', 'cell'][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
      
    // Page 9: Changing Answers
    case 9:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 9</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Changing Your Answers</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              You may change your answer to any question at any time during the examination, as long as 
              time remains in the current section.
            </p>
            
            <p>
              To change an answer:
            </p>
            
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Navigate back to the question you want to change</li>
              <li>Click on a different answer option to select it</li>
              <li>Your previous answer will automatically be deselected</li>
            </ol>
            
            <p className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-blue-800">
              <strong>Tip:</strong> Use the Section Review feature to quickly identify questions you 
              may want to revisit before submitting.
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 10: Answering Essays
    case 10:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 10</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Answering Essay Questions</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              Essay questions require a written analysis or explanation, usually of a specified length. 
              An essay question contains a question or statement, and an answer box where the response 
              is to be provided.
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              Practice typing your response for an essay question below. Click the 'Next' button to continue.
            </p>
            
            <div className="border border-slate-300 rounded-lg p-4 bg-white mt-4">
              <p className="mb-2 text-slate-600">Consider this statement:</p>
              <p className="mb-4 font-medium italic">
                "The primary goal of every business should be to maximize profits."
              </p>
              <p className="mb-4 text-slate-600">
                In essay format, describe a situation in which the statement is true and a situation 
                in which the statement is false.
              </p>
              
              {/* Rich text toolbar */}
              <div className="border border-slate-300 rounded-t-lg px-2 py-1 bg-slate-50 flex items-center gap-2">
                <select className="text-xs border border-slate-300 rounded px-1">
                  <option>AI</option>
                </select>
                <button className="font-bold px-1">B</button>
                <button className="italic px-1">I</button>
                <button className="underline px-1">U</button>
                <span className="text-slate-300">|</span>
                <button className="px-1">≡</button>
                <button className="px-1">≡</button>
                <button className="px-1">≡</button>
              </div>
              <textarea 
                className="w-full border border-slate-300 border-t-0 rounded-b-lg p-3 h-32 resize-none text-sm"
                placeholder="Type your response here..."
              />
            </div>
          </div>
        </div>
      );
      
    // Page 11: Word Processing Features
    case 11:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 11</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Word Processing Features</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              The essay response box includes basic word processing features:
            </p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Bold (B)</strong> - Make text bold</li>
              <li><strong>Italic (I)</strong> - Make text italic</li>
              <li><strong>Underline (U)</strong> - Underline text</li>
              <li><strong>Text Alignment</strong> - Left, center, or right align</li>
              <li><strong>Undo/Redo</strong> - Undo or redo recent changes</li>
            </ul>
            
            <p>
              To format text, select the text you want to format, then click the appropriate button 
              in the toolbar.
            </p>
            
            <p className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800">
              <strong>Note:</strong> Copy and paste functions are disabled during the examination.
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 12: Highlighting Text
    case 12:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 12</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Highlighting Text</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              During the examination, you will be able to highlight question text that you feel is 
              important to refer back to as you progress through the exam. The highlight will remain 
              present as you navigate through the exam, unless you select to remove it.
            </p>
            
            <p>
              To highlight text, click and drag the mouse cursor over the desired text. Click the 
              <strong> Highlight</strong> button, as shown in the image below, that appears after 
              releasing the mouse button. To remove, click on any area of the highlighted text and 
              click the <strong>Highlight</strong> button again.
            </p>
            
            <div className="bg-white border border-slate-300 rounded-lg p-4 my-4">
              <p>
                <span className="bg-yellow-200 px-1">How would you characterize</span> the young Frederick Douglass?
              </p>
              <div className="inline-flex mt-2 bg-[#8dc63f] text-white px-3 py-1 rounded items-center gap-1">
                <span>✏️</span>
              </div>
            </div>
            
            <p className="text-slate-600 italic">
              The highlight feature cannot be applied to text within the answer options.
            </p>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 13: Using the Calculator
    case 13:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 13</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Using the Calculator</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              A calculator is available during the examination. To access the calculator, click the 
              calculator icon in the toolbar.
            </p>
            
            <div className="flex justify-center my-4">
              <button className="bg-[#8dc63f] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                <Icons.Plus className="w-5 h-5" /> Calculator
              </button>
            </div>
            
            <p>
              The calculator will appear as an overlay on the screen. You can:
            </p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Click and drag the calculator to move it around the screen</li>
              <li>Use your mouse to click the calculator buttons</li>
              <li>Use your keyboard's number pad for faster input</li>
              <li>Click the X button to close the calculator</li>
            </ul>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 14: Section Review
    case 14:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 14</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Section Review</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              During the examination, you can review the status of all questions in a current exam 
              section using the grid icon <span className="inline-block w-5 h-5 bg-slate-300 rounded text-center">⊞</span> located 
              in the bottom left corner of the exam screen.
            </p>
            
            <p>
              To navigate directly to a question, click the corresponding numbered icon. You may also 
              filter your view by unattempted, attempted, and flagged questions. The Section Review can 
              be locked in place using the padlock icon and closed using the "X" icon.
            </p>
            
            {/* Visual mockup of Section Review */}
            <div className="bg-[#333] text-white rounded-lg p-4 my-4 max-w-xs">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold">Section Review</span>
                <div className="flex gap-2">
                  <span>🔓</span>
                  <span>✕</span>
                </div>
              </div>
              
              <div className="mb-3">
                <span className="text-xs text-slate-300">Filter by:</span>
                <div className="flex gap-2 mt-1">
                  {['Unattempted', 'Attempted', 'Flagged'].map(f => (
                    <label key={f} className="flex items-center gap-1 text-xs">
                      <input type="checkbox" className="w-3 h-3" />
                      {f}
                    </label>
                  ))}
                  <button className="text-xs bg-[#8dc63f] px-2 py-0.5 rounded">Clear</button>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-1">
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n => (
                  <div key={n} className={`w-8 h-6 flex items-center justify-center text-xs font-bold rounded ${
                    n <= 3 ? 'bg-slate-500' : n === 4 || n === 7 ? 'bg-[#8dc63f] relative' : 'bg-[#8dc63f]'
                  }`}>
                    {n}
                    {(n === 4 || n === 7) && <span className="absolute -top-1 -right-1 text-[8px]">🚩</span>}
                  </div>
                ))}
              </div>
            </div>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 15: Finishing the Exam
    case 15:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 15</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Finishing the Exam</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              When you are ready to finish a section of the exam, click the <strong>Finish Test</strong> button 
              in the upper right corner of the screen.
            </p>
            
            <div className="flex justify-center my-4">
              <button className="bg-slate-400 text-white px-6 py-2 rounded font-bold">
                Finish Test
              </button>
            </div>
            
            <p className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-800">
              <strong>Warning:</strong> Clicking "Finish Test" and selecting "Finish Exam" at any point 
              during the examination will end the entire exam. Any questions that are incomplete will 
              be marked as incorrect.
            </p>
            
            <p>
              Before finishing, you will be shown a summary of your progress:
            </p>
            
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Number of questions answered</li>
              <li>Number of questions unanswered</li>
              <li>Number of flagged questions</li>
            </ul>
            
            <p className="font-bold text-[#8dc63f]">
              Click the 'Next' button to continue.
            </p>
          </div>
        </div>
      );
      
    // Page 16: Tutorial Conclusion
    case 16:
      return (
        <div>
          <h1 className="text-xl font-bold text-[#333] mb-6">Introduction page 16</h1>
          <h2 className="text-lg font-bold text-[#8dc63f] mb-4">Tutorial Conclusion</h2>
          
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 text-sm text-[#333] leading-relaxed">
            <p>
              This concludes the tutorial. You can review the tutorial by clicking on the "Back" button 
              to back up one screen at a time, or by using the numbered buttons displayed on the left 
              side of the screen. You may view the tutorial at any point during an active examination 
              by clicking on the question mark icon. This icon can be found in the bottom left of the 
              screen once you have begun testing.
            </p>
            
            <p className="text-lg font-bold text-center my-6">
              Good luck with the examination.
            </p>
            
            <div className="bg-[#8dc63f]/10 border border-[#8dc63f] p-4 rounded-lg">
              <p className="font-bold text-[#8dc63f] text-center">
                Click the 'Start the Test' button to exit the tutorial and begin the examination.
              </p>
            </div>
          </div>
        </div>
      );
      
    default:
      return <p>Page {page}</p>;
  }
};

export const TOTAL_INTRO_PAGES = 16;
