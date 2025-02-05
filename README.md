# google-maps-extension
A web app built with React, Node.js, and Redux allowing users to create custom routes on Google Maps by adding a starting point, destination points, and waypoints. The app visualizes the route on the map and provides an interactive experience to view and manage user-defined routes.

### Technologies Used
- **Frontend:**
  - React
  - Redux (State Management)
  - Google Maps API
  - Google Maps Directions API (for routing)
- **Backend:**
  - Node.js (Express)
  - MySQL (Database)
  - RESTful APIs for database communication

## Features
- **Create Routes:** Users can define several routes with a starting point and destination point with additional waypoints along the route .
- **View Route on Map:** Once the points are added, the app visualizes the entire route on a Google Map.
- **State Management with Redux:** Redux is used to manage application state, including user input and the route data.
- **Backend Integration with MySQL:** The backend handles user route data, saving and retrieving it from a MySQL database through RESTful APIs.
- **Google Maps & Directions API:** The frontend integrates directly with the Google Maps API and the Google Maps Directions API to visualize and generate directions for the routes.

## Project Structure
The project is divided into two parts:
- **Frontend:** [GitHub Repository](https://github.com/Shashini-Siriwardhana/google-maps-extension-frontend)
- **Backend:** [GitHub Repository](https://github.com/Shashini-Siriwardhana/google-maps-extension-backend)
