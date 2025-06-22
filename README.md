# Schedulr

A modern event calendar application built with React and Tailwind CSS.

## Features

- Create, edit, and delete events
- Drag and drop events
- Recurring events support
- Event color categorization
- Search events
- Conflict detection
- Local storage persistence
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Pradeepkm21/schedulr.git
cd schedulr
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Build

To build the application for production:

```bash
npm run build
```

The build files will be created in the `build` folder.

## Technologies Used

- React
- Tailwind CSS
- Lucide React (for icons)
- Local Storage (for data persistence)

## Project Structure

```
schedulr/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   └── calendar/
│   │       ├── EventCalendar.js
│   │       └── EventForm.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── README.md
```

## License

MIT 