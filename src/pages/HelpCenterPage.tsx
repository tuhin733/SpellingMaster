import React, { useState } from "react";
import Header from "../components/Header";
import { ChevronDown, HelpCircle, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I create a custom word list?",
    answer:
      "To create a custom word list, go to the main menu and select 'Word Lists'. Click the '+' button to create a new list. You can then add words manually or import them from a file.",
  },
  {
    question: "Can I adjust the difficulty of practice sessions?",
    answer:
      "Yes! You can customize your study sessions in the Settings page. You can adjust the number of words per session and set time limits for answering each word.",
  },
  {
    question: "How does the progress tracking work?",
    answer:
      "The app tracks your performance across all practice sessions. It records your accuracy, speed, and commonly misspelled words. You can view your statistics in the Progress section.",
  },
  {
    question: "Can I use the app offline?",
    answer:
      "Yes, Spelling Master works offline! Your progress and custom word lists are stored locally on your device.",
  },
  {
    question: "How do I reset my progress?",
    answer:
      "You can reset your progress in the Settings page under 'Data Management'. You have the option to reset only your progress or all data including custom word lists.",
  },
];

const HelpCenterPage: React.FC = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col transition-colors duration-300 dark:from-secondary-900 dark:to-secondary-950">
      <Header showBack title="Help Center" />

      <main className="flex-1 container mx-auto p-5 max-w-3xl pb-12">
        {/* Help Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8 border border-blue-100 dark:border-blue-800/40">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
                Need Help?
              </h2>
              <p className="text-blue-600/80 dark:text-blue-300/80 mb-4">
                Find answers to common questions below or reach out to our
                support team.
              </p>
              <a
                href="mailto:support@spelling-master.com"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-800/40 dark:hover:bg-blue-800/60 rounded-lg transition-colors duration-200"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </a>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-b border-gray-200 dark:border-gray-700/50 last:border-0"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                      expandedIndex === index ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {expandedIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-4 text-gray-600 dark:text-gray-300">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HelpCenterPage;
