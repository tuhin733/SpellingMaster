import React from "react";
import Header from "../components/Header";
import { Github, Globe, Heart } from "lucide-react";

const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col transition-colors duration-300 dark:from-secondary-900 dark:to-secondary-950">
      <Header showBack title="About" />

      <main className="flex-1 container mx-auto p-5 max-w-3xl pb-12">
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-md p-6 md:p-8">
          {/* App Info Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
              <img
                src="/spelling-master-icon.svg"
                alt="Spelling Master Logo"
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Spelling Master
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Version 0.1.0</p>
          </div>

          {/* Description */}
          <div className="prose dark:prose-invert max-w-none mb-8">
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Spelling Master is an interactive learning application designed to
              help users improve their spelling skills through engaging practice
              sessions and personalized word lists.
            </p>
          </div>

          {/* Features List */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Key Features
            </h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 mr-3">
                  <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  Customizable study sessions with adjustable word counts and
                  time limits
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 mr-3">
                  <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  Create and manage custom word lists for targeted practice
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 mr-3">
                  <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  Progress tracking and performance statistics
                </span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mt-0.5 mr-3">
                  <span className="block w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                </span>
                <span className="text-gray-600 dark:text-gray-300">
                  Dark mode support for comfortable learning at any time
                </span>
              </li>
            </ul>
          </div>

          {/* Credits Section */}
          <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center mb-4">
              <p className="text-gray-600 dark:text-gray-300">
                Made with <Heart className="w-4 h-4 inline text-red-500 mx-1" />{" "}
                by the Spelling Master Team
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <a
                href="https://github.com/spelling-master"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://spelling-master.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;
