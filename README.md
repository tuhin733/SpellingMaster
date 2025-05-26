# Spelling Master

A React application for practicing and mastering spelling in multiple languages through interactive flashcards and progressive difficulty levels.

## Features

- Interactive flashcards with text-to-speech pronunciation
- Multiple difficulty levels to track learning progress
- Support for uploading custom word lists (CSV, Excel)
- Progress tracking and statistics
- Multi-language support through built-in translation
- Dark mode and light mode
- Customizable font sizes and accessibility settings
- Offline functionality with IndexedDB storage
- Responsive design for mobile, tablet, and desktop

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Animations**: Framer Motion
- **Storage**: IndexedDB (using idb)
- **File Handling**: Papa Parse (CSV), XLSX (Excel)
- **Routing**: React Router
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/spelling-master.git
cd spelling-master
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── components/      # Reusable UI components
├── contexts/        # React contexts for state management
├── data/            # Application data and word lists
├── hooks/           # Custom React hooks
├── locales/         # Translation files
├── pages/           # Application pages/screens
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── App.tsx          # Main application component
└── main.tsx         # Application entry point
```

## Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## Features in Detail

### Word Lists

The application comes with predefined word lists, but users can also upload their own lists in CSV or Excel format.

### Progress Tracking

User progress is saved locally using IndexedDB, allowing them to continue from where they left off, even offline.

### Text-to-Speech

The application uses the browser's built-in speech synthesis API to pronounce words, helping users learn proper pronunciation.

### Translations

Spelling Master includes built-in translation capabilities, allowing the interface to be displayed in multiple languages.

## License

This project is licensed under the MIT License.
