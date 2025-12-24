# BuffetBingo

![Buffet Bingo](buffet-bingo/src/assets/header.jpg)

BuffetBingo is a single-page web application (SPA) built with React. It leverages Firebase for backend services, specifically utilizing Firebase Authentication for user management and Firebase Storage and Firestore for data handling.

## Technologies Used

*   **Frontend:** React
*   **Backend:** Firebase (Authentication, Storage)
*   **Package Manager:** NPM

## Prerequisites

Before you begin, ensure you have met the following requirements:

*   You have installed [Node.js](https://nodejs.org/) and npm.
*   You have a Firebase project set up with Authentication and Storage enabled.

## Local Development Setup

To get a local copy up and running, follow these simple steps.

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/kolaf/buffetbingo.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd buffetbingo
    ```
3.  Install the dependencies:
    ```sh
    npm install
    ```
4.  **Configuration**: Create a `.env` file in the root directory and add your Firebase configuration details (refer to `.env.example` if available):
    ```env
    REACT_APP_FIREBASE_API_KEY=your_api_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    REACT_APP_FIREBASE_PROJECT_ID=your_project_id
    REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    REACT_APP_FIREBASE_APP_ID=your_app_id
    ```

### Running the Application

To start the development server:

```sh
npm run dev
```

The application will run at `http://localhost:5173`.

## Building and Testing

### Build

To build the app for production to the `build` folder:

```sh
npm run build
```

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
