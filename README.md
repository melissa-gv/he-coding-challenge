# Frontend Developer Coding Challenge

Welcome! This coding challenge is designed to assess your frontend development skills through building a real-world industrial asset management dashboard.

## Overview

You'll build a web application that interfaces with a provided backend API to display and manage industrial assets (pumps, compressors, generators, etc.). The API provides real-time telemetry data, historical power consumption data, and configuration management capabilities.

## Time Expectation

This challenge is designed to take approximately 3-4 hours. Focus on demonstrating your core frontend skills rather than perfection in every detail.

## Getting Started

### 1. Start the Backend API

From the project root, use Docker Compose:

```bash
docker-compose up
```

Or navigate to the `api/` directory and use Docker directly:

```bash
cd api
docker build -t asset-management-api .
docker run -p 8000:8000 asset-management-api
```

### 2. Verify the API is Running

- API: http://localhost:8000
- Interactive API Documentation: http://localhost:8000/docs

### 3. Build Your Frontend Application

Create your application in the `app/` directory. You may use any frontend framework, libraries, and tools you prefer.

## Requirements

### Core Requirements

Your application must include:

1. **Asset List View**
   - Display all available assets from the API
   - Show key asset information (name, type, location, status)

2. **Telemetry Display**
   - Show current telemetry data for selected asset(s)
   - Display metrics like temperature, pressure, vibration, power consumption
   - Data should be easy to read and understand at a glance

3. **Power Consumption Visualization**
   - Create a chart/graph displaying historical and forecast power data
   - The API provides 8 hours of history and 16 hours of forecast
   - Clearly differentiate between historical (actual) and forecast (predicted) data
   - Display both power consumption and efficiency metrics
   - Handle both power consumption (positive values) and generation (negative values)

4. **Configuration Form**
   - Build a form to create/update asset configurations
   - Implement client-side validation matching the API's validation rules
   - Handle and display server-side validation errors appropriately
   - Provide clear feedback on form submission success/failure

### Bonus (Optional)

- **Real-Time Updates**: Connect to the WebSocket endpoint (`ws://localhost:8000/ws/telemetry`) to display live telemetry updates
- **Responsive Design**: Make the application work well on different screen sizes
- **Advanced Visualizations**: Interactive charts, custom visualizations, or multiple views of the data
- **State Management**: Demonstrate sophisticated state management patterns
- **Testing**: Include unit or integration tests

## API Quick Reference

The backend API provides these key endpoints:

- `GET /api/assets` - List all assets
- `GET /api/assets/{asset_id}` - Get specific asset details
- `GET /api/telemetry/{asset_id}` - Get current telemetry (dynamic data)
- `GET /api/power/{asset_id}` - Get power history + forecast for charting
- `POST /api/configuration` - Create/update asset configuration
- `GET /api/configuration/{asset_id}` - Get stored configuration
- `WS /ws/telemetry` - WebSocket for real-time telemetry updates

For detailed API documentation including request/response schemas and validation rules, see:

- Interactive docs at http://localhost:8000/docs
- Technical notes in `api/API_NOTES.md`

## What We're Looking For

We'll evaluate your submission based on:

- **Code Quality**: Clear, maintainable, well-organized code
- **Data Visualization**: Effective chart implementation and design choices
- **Form Handling**: Validation logic and error handling
- **UI/UX Design**: Intuitive interface and user experience
- **State Management**: How you manage application state
- **Technical Decisions**: Framework choices, architecture, and trade-offs

### On Agentic Development

We believe that the development landcape is changing quickly,
and that agentic work is steadily becoming more productive as a tool.
However, the human in the loop is ultimately reponsible for the output
in terms of functionality, performance, safety, and clean maintainable code.

You are free to use agentic tooling in your work here,
but do also treat your submission like a PR that would be reviewed by us --
make sure that the code you submit meets a high review-worthy standard
and does not include unnecessary artifacts that shouldn't be committed.

## Submission

When you're finished, please provide:

1. Your complete application code in the `app/` directory
2. A `NOTES.md` file at the project root with:
   - Setup instructions (how to install dependencies and run your application)
   - Any framework/library choices you made and why
   - What you would improve given more time
   - Any assumptions or decisions you made

## Questions?

If you have any questions about the challenge requirements or API behavior, please don't hesitate to reach out.

Good luck, and we look forward to seeing what you build!
