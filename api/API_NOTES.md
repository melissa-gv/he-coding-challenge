# Asset Management API - Technical Notes

A FastAPI-based backend service that provides endpoints for managing industrial assets, retrieving telemetry data, and configuring asset parameters.

## Quick Start

### Using Docker (Recommended)

1. Build the Docker image:
```bash
docker build -t asset-management-api .
```

2. Run the container:
```bash
docker run -p 8000:8000 asset-management-api
```

### Using uv (Local Development)

1. Install [uv](https://github.com/astral-sh/uv) if you haven't already:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Install dependencies:
```bash
uv pip install -r pyproject.toml
```

3. Run the application:
```bash
uv run uvicorn main:app --reload
```

Or directly with Python:
```bash
python main.py
```

## API Documentation

Once running, access the interactive API documentation at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These interfaces provide complete API specifications, request/response schemas, and allow you to test endpoints interactively.

## Available Assets

The API provides 5 predefined assets:

1. **AST-001**: Primary Cooling Pump (operational)
2. **AST-002**: Air Compressor Unit 1 (operational)
3. **AST-003**: Backup Generator (standby)
4. **AST-004**: Hydraulic Motor 5 (maintenance)
5. **AST-005**: Wind Turbine Alpha (operational)

## Key API Endpoints

### GET `/api/assets`
Retrieve list of all assets (static data).

### GET `/api/assets/{asset_id}`
Retrieve details for a specific asset.

### GET `/api/telemetry/{asset_id}`
Retrieve current telemetry data for a specific asset. This data is dynamically generated on each request.

### GET `/api/power/{asset_id}`
Retrieve power consumption history (8 hours at 15-min intervals) and forecast (16 hours at 30-min intervals) for charting.

**Data Structure:**
- `history`: 32 data points of historical power consumption
- `forecast`: 32 data points of forecasted power consumption
- Each point includes: `timestamp`, `power_kw`, `efficiency`
- `metadata`: Summary statistics and asset information

**Power Values:**
- Positive values = power consumption (pumps, compressors, motors)
- Negative values = power generation (generators, turbines)

### POST `/api/configuration`
Create or update asset configuration with comprehensive validation.

**Validation Rules:**

**Enum Fields (must match exactly):**
- `priority`: `low` | `medium` | `high` | `critical`
- `maintenance_mode`: `scheduled` | `predictive` | `reactive`
- `operating_mode`: `continuous` | `intermittent` | `on_demand`

**Integer Fields:**
- `maintenance_interval_days`: 1 to 365
- `max_runtime_hours`: 1 to 100,000 (must be positive)
- `warning_threshold_percent`: 0 to 100

**Float Fields:**
- `max_temperature_celsius`: -50.0 to 200.0
- `max_pressure_psi`: 0.0 to 10,000.0 (must be positive)
- `efficiency_target_percent`: 0.0 to 100.0
- `power_factor`: -1.0 to 1.0 (cannot be exactly 0)
- `load_capacity_percent`: 0.0 to 150.0

**String Fields:**
- `asset_id`: 1-50 characters (must be a valid existing asset)
- `name`: 3-100 characters
- `alert_email`: Valid email format (auto-converted to lowercase)
- `location`: 1-200 characters
- `notes`: Optional, maximum 500 characters

### GET `/api/configuration/{asset_id}`
Retrieve stored configuration for a specific asset.

### GET `/api/configurations`
Retrieve all stored asset configurations.

### DELETE `/api/configuration/{asset_id}`
Delete configuration for a specific asset.

### WebSocket `/ws/telemetry`
WebSocket endpoint that broadcasts live telemetry updates for all assets every 2 seconds.

**Connection:** `ws://localhost:8000/ws/telemetry`

**Message Format:**
```json
{
  "type": "telemetry_update",
  "timestamp": "2024-01-15T10:35:22.123456Z",
  "data": [
    {
      "asset_id": "AST-001",
      "timestamp": "2024-01-15T10:35:22.123456Z",
      "temperature": 47.3,
      "pressure": 125.8,
      "vibration": 2.1,
      "power_consumption": 16.5,
      "status": "operational"
    }
  ]
}
```

**JavaScript Example:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/telemetry');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Telemetry update:', message.data);
};
```

## Development Notes

- **CORS**: Enabled for all origins to facilitate frontend development
- **Data Storage**: Configurations are stored in-memory (reset on restart)
- **Telemetry**: Data is randomly generated but realistic based on asset type and status
- **Timestamps**: All timestamps are in ISO 8601 format with UTC timezone

## Testing the API

Use the Swagger UI at http://localhost:8000/docs for interactive testing.

Example curl commands:

```bash
# Get all assets
curl http://localhost:8000/api/assets

# Get telemetry for AST-001
curl http://localhost:8000/api/telemetry/AST-001

# Get power data for charting
curl http://localhost:8000/api/power/AST-001

# Create configuration
curl -X POST http://localhost:8000/api/configuration \
  -H "Content-Type: application/json" \
  -d '{
    "asset_id": "AST-001",
    "name": "Primary Cooling Pump",
    "priority": "high",
    "maintenance_mode": "predictive",
    "operating_mode": "continuous",
    "maintenance_interval_days": 30,
    "max_runtime_hours": 50000,
    "warning_threshold_percent": 85,
    "max_temperature_celsius": 80.0,
    "max_pressure_psi": 200.0,
    "efficiency_target_percent": 85.0,
    "power_factor": 0.95,
    "load_capacity_percent": 100.0,
    "alert_email": "engineer@example.com",
    "location": "Building A - Floor 1"
  }'
```

## Technology Stack

- **FastAPI**: Modern Python web framework
- **Pydantic**: Data validation using Python type hints
- **Uvicorn**: ASGI server
- **WebSockets**: Real-time bidirectional communication
- **uv**: Fast Python package installer and resolver
