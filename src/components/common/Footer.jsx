import React from 'react';

/**
 * Global Ashrith Krishna Footer & Portfolio Link
 * Pure presentational component with zero database, API, or context dependencies.
 */
const Footer = () => {
  return (
    <footer className="w-full mt-auto border-t border-gray-200/80 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm py-5 px-4 sm:px-6 md:px-8 text-xs transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Column: Title & Tagline */}
        <div className="space-y-1">
          <p className="font-semibold text-gray-800 dark:text-gray-200 text-xs sm:text-sm tracking-tight">
            Built & Designed by Ashrith Krishna
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            Engineering ideas into meaningful digital experiences.
          </p>
        </div>

        {/* Right Column / Bottom Stack: Copyright & Portfolio Link */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200/60 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            © 2026 KLU CSE-2 Department. All Rights Reserved.
          </span>
          
          <a
            href="https://myportfolio-eight-ecru-21.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View Ashrith Krishna's Personal Portfolio (opens in a new tab)"
            className="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
          >
            View Portfolio &rarr;
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
